import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getOrCreateUser } from '@/lib/whatsapp/handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '6281234567890';

    const user = await getOrCreateUser(phone);
    const supabase = getAdminClient();

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    return NextResponse.json({
      user,
      categories: categories || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone = '6281234567890', monthly_budget, budget_start_day } = body;

    const user = await getOrCreateUser(phone);
    const supabase = getAdminClient();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (monthly_budget !== undefined) {
      updatePayload.monthly_budget = Number(monthly_budget);
    }
    if (budget_start_day !== undefined) {
      updatePayload.budget_start_day = Number(budget_start_day);
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
