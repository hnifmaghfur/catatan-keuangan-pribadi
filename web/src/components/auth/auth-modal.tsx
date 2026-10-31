'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { X, Lock, Mail, Smartphone, User, ArrowRight, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithPhoneQuick } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'quick_phone'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        if (!phoneInput) {
          setErrorMsg('Nomor WhatsApp wajib diisi agar catatan chat tersambung');
          setLoading(false);
          return;
        }
        const res = await signUpWithEmail(email, password, phoneInput, name);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Akun berhasil dibuat dan tersambung!');
          setTimeout(() => onClose(), 1000);
        }
      } else if (mode === 'quick_phone') {
        const res = await signInWithPhoneQuick(phoneInput);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {mode === 'signin' && 'Masuk ke Akun'}
              {mode === 'signup' && 'Daftar Akun Baru'}
              {mode === 'quick_phone' && 'Masuk via Nomor WhatsApp'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'quick_phone'
                ? 'Akses langsung data pengeluaran WhatsApp Anda'
                : 'Sinkronisasi data web dan WhatsApp Anda'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mt-4 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daftar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('quick_phone');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              mode === 'quick_phone'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Cepat (WA)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          {(mode === 'signup' || mode === 'quick_phone') && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789 atau 62812..."
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Nomor yang Anda gunakan untuk kirim pesan ke bot WhatsApp
              </p>
            </div>
          )}

          {mode !== 'quick_phone' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 text-sm"
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  {mode === 'signin' && 'Masuk Sekarang'}
                  {mode === 'signup' && 'Buat Akun'}
                  {mode === 'quick_phone' && 'Buka Keuangan Saya'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {mode === 'quick_phone' && (
          <div className="mt-4 p-3 bg-emerald-50/60 rounded-2xl text-[11px] text-emerald-800 flex items-start gap-2 border border-emerald-100">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Mode Cepat memungkinkan Anda langsung melihat pengeluaran hanya dengan nomor WhatsApp tanpa perlu membuat password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
