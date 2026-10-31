import { NextRequest, NextResponse } from 'next/server';
import { handleIncomingTelegramMessage } from '@/lib/telegram/handler';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://catatan-keuangan-pribadi-theta.vercel.app';

  return NextResponse.json({
    status: token ? 'configured' : 'missing_token',
    webhook_url: `${appUrl}/api/telegram`,
    setup_instruction: token
      ? `To set webhook, visit: https://api.telegram.org/bot${token}/setWebhook?url=${appUrl}/api/telegram`
      : 'Please add TELEGRAM_BOT_TOKEN to environment variables',
  });
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN is not configured');
      return NextResponse.json({ ok: false, error: 'Bot token not set' }, { status: 500 });
    }

    const body = await req.json();
    const message = body.message || body.edited_message;

    if (!message || !message.chat || !message.text) {
      return NextResponse.json({ ok: true }); // Acknowledge non-text updates
    }

    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from?.first_name || message.from?.username;

    await handleIncomingTelegramMessage({
      chatId,
      text,
      firstName,
      botToken: token,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error handling Telegram update:', error);
    return NextResponse.json({ ok: false, error: error?.message }, { status: 500 });
  }
}
