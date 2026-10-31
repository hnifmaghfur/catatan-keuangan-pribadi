import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import * as path from 'path';

const VERCEL_API_URL = process.env.VERCEL_API_URL || 'http://localhost:3000/api/whatsapp';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev_secret_key_123';
const AUTH_DIR = path.resolve(process.env.AUTH_DIR || './auth_state');

async function startBot() {
  console.log(`[Bot] Initializing WhatsApp Bot with auth dir: ${AUTH_DIR}`);
  console.log(`[Bot] Webhook target: ${VERCEL_API_URL}`);

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`[Bot] Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'error' }),
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('[Bot] Scan QR code above to connect WhatsApp.');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.warn(`[Bot] Connection closed. Reason code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => {
          startBot();
        }, 5000);
      } else {
        console.error('[Bot] Logged out from WhatsApp. Clear auth_state directory and restart to re-scan QR.');
      }
    } else if (connection === 'open') {
      console.log('✅ [Bot] WhatsApp connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith('@g.us')) {
        // Skip group messages if personal finance app is direct message only
        continue;
      }

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';

      if (!text.trim()) continue;

      const senderNumber = remoteJid.replace(/@.+/, '');
      console.log(`[Bot] Received message from ${senderNumber}: "${text}"`);

      try {
        const response = await fetch(VERCEL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': WEBHOOK_SECRET,
          },
          body: JSON.stringify({
            from: senderNumber,
            remoteJid,
            message: text,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Bot] Webhook error (${response.status}):`, errText);
          await sock.sendMessage(remoteJid, {
            text: '⚠️ Sistem sedang mengalami gangguan saat memproses pesan Anda. Silakan coba sesaat lagi.',
          });
          continue;
        }

        const data = (await response.json()) as { reply?: string };
        if (data && data.reply) {
          await sock.sendMessage(remoteJid, { text: data.reply });
        }
      } catch (error) {
        console.error('[Bot] Network or processing error:', error);
        await sock.sendMessage(remoteJid, {
          text: '⚠️ Gagal terhubung ke server aplikasi. Silakan coba lagi nanti.',
        });
      }
    }
  });
}

startBot().catch((err) => {
  console.error('[Bot] Fatal error starting bot:', err);
});
