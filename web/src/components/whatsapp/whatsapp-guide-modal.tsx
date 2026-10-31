'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, RefreshCw, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BotStatusState {
  status: 'connected' | 'scan_needed' | 'disconnected' | 'loading';
  qr: string | null;
  connectedPhone: string | null;
  updated_at?: string;
}

export function WhatsAppGuideModal() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatusState>({
    status: 'loading',
    qr: null,
    connectedPhone: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBotStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/whatsapp/qr', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBotStatus({
          status: data.status || 'disconnected',
          qr: data.qr || null,
          connectedPhone: data.connectedPhone || null,
          updated_at: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error fetching bot status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    // Poll every 3 seconds to auto-update when user scans QR
    const interval = setInterval(fetchBotStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sampleCommands = [
    { cmd: '25000 nasi padang #makan', label: 'Catat pengeluaran makan' },
    { cmd: '15k grab ke kantor #transport', label: 'Catat transport (shortcut k)' },
    { cmd: 'hari ini', label: 'Cek total & estimasi hari ini' },
    { cmd: 'budget', label: 'Cek status sisa budget & kuota harian' },
    { cmd: 'riwayat', label: 'Lihat 10 transaksi terakhir' },
    { cmd: 'set budget 3jt', label: 'Atur budget bulanan baru' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">WhatsApp Bot Integration</h3>
            <p className="text-xs text-slate-400">Pencatatan & cek saldo via chat</p>
          </div>
        </div>

        <button
          onClick={fetchBotStatus}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-50 transition-colors"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* QR Code / Connection Status Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        {botStatus.status === 'connected' ? (
          <div className="py-4 flex flex-col items-center gap-3 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">WhatsApp Bot Terhubung!</h4>
              {botStatus.connectedPhone && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Nomor: +{botStatus.connectedPhone}
                </p>
              )}
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Bot Aktif & Siap Menerima Chat
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Silakan kirim pesan apa saja (misal: <code className="text-emerald-700 font-bold">hari ini</code>) ke nomor WhatsApp bot Anda.
            </p>
          </div>
        ) : botStatus.qr ? (
          <div className="flex flex-col items-center gap-4 w-full animate-in fade-in">
            <div className="text-center">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-1">
                Scan QR Code WhatsApp
              </span>
              <p className="text-xs text-slate-500">
                Tautkan WhatsApp Anda langsung dari layar ini
              </p>
            </div>

            {/* Crisp QR Code Container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <QRCodeSVG
                value={botStatus.qr}
                size={220}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Menunggu scan... (Otomatis terhubung saat discan)</span>
            </div>

            {/* Instruction Steps */}
            <div className="bg-slate-50 rounded-2xl p-4 text-left w-full text-xs text-slate-600 space-y-1.5 border border-slate-100">
              <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Cara Menautkan WhatsApp:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                <li>Buka aplikasi <strong>WhatsApp</strong> di HP Anda</li>
                <li>Buka <strong>Pengaturan / Menu</strong> &rarr; <strong>Perangkat Tertaut</strong></li>
                <li>Ketuk <strong>Tautkan Perangkat</strong></li>
                <li>Arahkan kamera ke QR Code di atas</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs text-slate-500">
              Menghubungkan ke server WhatsApp Bot Fly.io...
            </p>
            <p className="text-[11px] text-slate-400">
              QR Code akan muncul dalam beberapa saat
            </p>
          </div>
        )}
      </div>

      {/* Quick WhatsApp format tips */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-700 block">Perintah Chat WhatsApp:</span>
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
