import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getOrCreateUser } from '@/lib/whatsapp/handler';
import { computeBudgetSummary, getBudgetPeriod } from '@/lib/calculations';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '6281234567890'; // Default demo phone if not provided

    const user = await getOrCreateUser(phone);
    const supabase = getAdminClient();
    const todayStr = new Date().toISOString().split('T')[0];

    const { periodStart, periodEnd } = getBudgetPeriod(user.budget_start_day || 1);
    const periodStartStr = periodStart.toISOString().split('T')[0];
    const periodEndStr = periodEnd.toISOString().split('T')[0];

    // Fetch transactions for period
    const { data: periodTxs, error } = await supabase
      .from('transactions')
      .select('amount, transaction_date')
      .eq('user_id', user.id)
      .gte('transaction_date', periodStartStr)
      .lte('transaction_date', periodEndStr);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const txs = periodTxs || [];
    const totalSpent = txs.reduce((sum, item) => sum + Number(item.amount), 0);
    const todaySpent = txs
      .filter((item) => item.transaction_date === todayStr)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const summary = computeBudgetSummary({
      monthlyBudget: Number(user.monthly_budget || 0),
      totalSpent,
      todaySpent,
      budgetStartDay: user.budget_start_day || 1,
    });

    return NextResponse.json({
      user,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
