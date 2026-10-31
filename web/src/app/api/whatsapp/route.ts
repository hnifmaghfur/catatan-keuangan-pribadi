import { NextRequest, NextResponse } from 'next/server';
import { handleIncomingWhatsApp } from '@/lib/whatsapp/handler';

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get('X-Webhook-Secret');

    if (expectedSecret && incomingSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid webhook secret' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { from, message } = body;

    if (!from || !message) {
      return NextResponse.json(
        { error: 'Missing "from" or "message" in request body' },
        { status: 400 }
      );
    }

    const reply = await handleIncomingWhatsApp({
      from: String(from),
      message: String(message),
    });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json(
      {
        reply: '⚠️ Terjadi kesalahan pada server pencatatan keuangan. Silakan coba lagi nanti.',
        error: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
