'use client';

import React from 'react';
import { MessageSquare, Copy, Check, ExternalLink } from 'lucide-react';

interface WhatsAppGuideModalProps {
  onClose?: () => void;
}

export function WhatsAppGuideModal({ onClose }: WhatsAppGuideModalProps) {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sampleCommands = [
    { cmd: '25000 nasi goreng #makan', label: 'Catat pengeluaran makan' },
    { cmd: '15k grab ke kantor #transport', label: 'Catat transport (shortcut k)' },
    { cmd: 'hari ini', label: 'Cek total & estimasi hari ini' },
    { cmd: 'budget', label: 'Cek status sisa budget & kuota harian' },
    { cmd: 'riwayat', label: 'Lihat 10 transaksi terakhir' },
    { cmd: 'set budget 3jt', label: 'Atur budget bulanan baru' },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Integrasi WhatsApp Bot</h3>
          <p className="text-xs text-slate-400">Semua kebutuhan keuangan bisa via chat</p>
        </div>
      </div>

      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3.5 text-xs text-emerald-900 leading-relaxed">
        <p className="font-semibold mb-1">💡 Cara Mencatat dari WhatsApp:</p>
        <p>
          Cukup kirim pesan ke bot dengan format: <br />
          <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-semibold">[nominal] [deskripsi] #[kategori]</code>
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 block">Perintah Cepat WhatsApp:</span>
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
              <button className="text-slate-400 hover:text-emerald-600 p-1">
                {copiedText === item.cmd ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
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
