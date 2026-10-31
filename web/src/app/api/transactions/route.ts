import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getOrCreateUser } from '@/lib/whatsapp/handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '6281234567890';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const user = await getOrCreateUser(phone);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, emoji)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone = '6281234567890', amount, description, category_id, transaction_date } = body;

    if (!amount || !description) {
      return NextResponse.json({ error: 'Amount and description are required' }, { status: 400 });
    }

    const user = await getOrCreateUser(phone);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        category_id: category_id || null,
        amount: Number(amount),
        description: String(description),
        source: 'web',
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
      })
      .select('*, categories(name, emoji)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
