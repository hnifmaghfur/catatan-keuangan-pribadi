import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('phone_number', '__bot_session__')
      .single();

    if (error || !data || !data.name) {
      return NextResponse.json({
        status: 'disconnected',
        qr: null,
        connectedPhone: null,
      });
    }

    try {
      const parsed = JSON.parse(data.name);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        status: 'scan_needed',
        qr: data.name,
        connectedPhone: null,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get('X-Webhook-Secret');

    if (expectedSecret && incomingSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { qr, status, connectedPhone } = body;

    const payload = JSON.stringify({
      qr: qr || null,
      status: status || 'unknown',
      connectedPhone: connectedPhone || null,
      updated_at: new Date().toISOString(),
    });

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          phone_number: '__bot_session__',
          name: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
