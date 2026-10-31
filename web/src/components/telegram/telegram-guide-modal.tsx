'use client';

import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

export function TelegramGuideModal() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<{
    status: string;
    webhook_url: string;
    setup_instruction: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/telegram')
      .then((res) => res.json())
      .then((data) => setWebhookStatus(data))
      .catch((err) => console.error(err));
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sampleCommands = [
    { cmd: '25000 nasi padang #makan', label: 'Catat pengeluaran makan' },
    { cmd: '15k grab ke kantor #transport', label: 'Catat transport (shortcut k)' },
    { cmd: '/hariini', label: 'Cek total & estimasi kuota hari ini' },
    { cmd: '/budget', label: 'Cek status sisa budget & kuota harian' },
    { cmd: '/riwayat', label: 'Lihat 10 transaksi terakhir' },
    { cmd: '/link 08123456789', label: 'Tautkan Telegram ke no HP web' },
    { cmd: 'set budget 3jt', label: 'Atur budget bulanan baru' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-sky-500/20 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold">Telegram Bot</h3>
              <span className="bg-white/25 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                100% Serverless
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-0.5">
              Aktif 24/7 di Vercel tanpa perlu server/laptop menyala
            </p>
          </div>
        </div>
      </div>

      {/* Setup Guide Steps */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-500" />
          Cara Menghubungkan Telegram Bot (1 Menit):
        </h4>

        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-semibold text-slate-800">Buat Bot di Telegram:</p>
              <p className="text-slate-500 mt-0.5">
                Buka Telegram dan cari <strong>@BotFather</strong>, lalu kirim perintah <code>/newbot</code>.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-semibold text-slate-800">Salin Token Bot:</p>
              <p className="text-slate-500 mt-0.5">
                @BotFather akan memberikan token API (contoh: <code>123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</code>).
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-semibold text-slate-800">Pasang Token di Vercel:</p>
              <p className="text-slate-500 mt-0.5">
                Buka dashboard Vercel &rarr; Settings &rarr; Environment Variables, tambahkan:
              </p>
              <div className="bg-slate-900 text-emerald-400 p-2 rounded-xl font-mono text-[11px] mt-1.5 flex items-center justify-between">
                <span>TELEGRAM_BOT_TOKEN=&lt;TOKEN_ANDA&gt;</span>
                <button
                  onClick={() => handleCopy('TELEGRAM_BOT_TOKEN')}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {copiedText === 'TELEGRAM_BOT_TOKEN' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              4
            </span>
            <div>
              <p className="font-semibold text-slate-800">Aktifkan Webhook:</p>
              <p className="text-slate-500 mt-0.5">
                Cukup buka URL ini di browser Anda sekali saja:
              </p>
              <p className="bg-sky-50 text-sky-800 p-2 rounded-xl font-mono text-[10px] break-all mt-1">
                https://api.telegram.org/bot&lt;TOKEN_ANDA&gt;/setWebhook?url=https://catatan-keuangan-pribadi-theta.vercel.app/api/telegram
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Commands Cheat Sheet */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-700 block">Perintah Chat Telegram:</span>
        <div className="space-y-1.5">
          {sampleCommands.map((item) => (
            <div
              key={item.cmd}
              onClick={() => handleCopy(item.cmd)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer transition-colors"
            >
              <div>
                <span className="text-xs font-mono font-semibold text-slate-800">{item.cmd}</span>
                <span className="text-[10px] text-slate-400 block">{item.label}</span>
              </div>
              <button className="text-slate-400 hover:text-sky-600 p-1">
                {copiedText === item.cmd ? (
                  <Check className="w-3.5 h-3.5 text-sky-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
