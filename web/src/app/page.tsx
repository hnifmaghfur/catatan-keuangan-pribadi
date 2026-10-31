'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MobileContainer } from '@/components/layout/mobile-container';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { DailyEstimateCard } from '@/components/dashboard/daily-estimate-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { QuickAddModal } from '@/components/transactions/quick-add-modal';
import { WhatsAppGuideModal } from '@/components/whatsapp/whatsapp-guide-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
import { BudgetSummary, Category, Transaction, User } from '@/types';
import { RefreshCw, User as UserIcon, LogOut, LogIn, Trash2 } from 'lucide-react';
import { formatDateIndo, formatRupiah } from '@/lib/utils';

export default function HomePage() {
  const { phone, profile, authUser, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'budget' | 'whatsapp'>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Budget form state
  const [newBudgetInput, setNewBudgetInput] = useState('');
  const [startDayInput, setStartDayInput] = useState('1');
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetSuccessMsg, setBudgetSuccessMsg] = useState('');

  const currentPhone = phone || '6281234567890';

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [sumRes, txRes, budgetRes] = await Promise.all([
        fetch(`/api/summary?phone=${encodeURIComponent(currentPhone)}`),
        fetch(`/api/transactions?phone=${encodeURIComponent(currentPhone)}&limit=30`),
        fetch(`/api/budget?phone=${encodeURIComponent(currentPhone)}`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
        setUser(sumData.user);
        if (sumData.user) {
          setNewBudgetInput(String(sumData.user.monthly_budget || ''));
          setStartDayInput(String(sumData.user.budget_start_day || '1'));
        }
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }

      if (budgetRes.ok) {
        const bData = await budgetRes.json();
        setCategories(bData.categories || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [currentPhone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    setBudgetSuccessMsg('');
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentPhone,
          monthly_budget: parseFloat(newBudgetInput) || 0,
          budget_start_day: parseInt(startDayInput, 10) || 1,
        }),
      });

      if (res.ok) {
        setBudgetSuccessMsg('Target budget berhasil diperbarui!');
        fetchData();
        setTimeout(() => setBudgetSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fallback demo summary if database is still empty or loading
  const currentSummary: BudgetSummary = summary || {
    monthlyBudget: 3000000,
    totalSpent: 0,
    remainingBudget: 3000000,
    todaySpent: 0,
    dailyEstimate: 100000,
    remainingDays: 30,
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    percentSpent: 0,
    isOverBudget: false,
  };

  return (
    <MobileContainer>
      {/* Top Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">
            📒
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">
              Catatan Keuangan
            </h1>
            <p className="text-[10px] text-slate-400">
              {phone ? `+${phone}` : 'Demo User'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {phone || authUser ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 p-1.5 px-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="Kelola Akun"
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[70px] truncate">
                  {profile?.name || (phone ? `+${phone.slice(-4)}` : 'Akun')}
                </span>
              </button>
              <button
                onClick={signOut}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        {/* TAB 1: BERANDA / HOME */}
        {activeTab === 'home' && (
          <>
            {/* Summary Card with Remaining Money and Progress */}
            <SummaryCard summary={currentSummary} />

            {/* Daily Estimation Card: Core requested feature */}
            <DailyEstimateCard summary={currentSummary} />

            {/* WhatsApp Integration Shortcut Card */}
            <div
              onClick={() => setActiveTab('whatsapp')}
              className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shadow-sm">
                  💬
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Bisa Catat & Cek Langsung dari WhatsApp
                  </h4>
                  <p className="text-[10px] text-emerald-700">
                    Ketik &quot;hari ini&quot;, &quot;budget&quot;, atau &quot;25k bakso #makan&quot;
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                Buka Bot →
              </span>
            </div>

            {/* Recent Transactions Section */}
            <RecentTransactions
              transactions={transactions}
              onViewAll={() => setActiveTab('history')}
            />
          </>
        )}

        {/* TAB 2: RIWAYAT / HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-base font-bold text-slate-800">Daftar Transaksi</h2>
              <span className="text-xs text-slate-400">{transactions.length} total</span>
            </div>

            {transactions.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-100">
                <p className="text-sm">Belum ada transaksi yang tercatat.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                        {tx.categories?.emoji || '📦'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">
                          {tx.description}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{tx.categories?.name || 'Lainnya'}</span>
                          <span>•</span>
                          <span>{formatDateIndo(tx.transaction_date)}</span>
                          <span>•</span>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                            {tx.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        -{formatRupiah(tx.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BUDGET & SETTINGS */}
        {activeTab === 'budget' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="pt-1">
              <h2 className="text-base font-bold text-slate-800">Pengaturan Budget</h2>
              <p className="text-xs text-slate-400">
                Atur nominal anggaran bulanan & tanggal awal siklus
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              {budgetSuccessMsg && (
                <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                  {budgetSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Target Budget Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={newBudgetInput}
                    onChange={(e) => setNewBudgetInput(e.target.value)}
                    placeholder="3000000"
                    className="w-full text-base font-bold px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Estimasi harian akan dihitung dari sisa budget ini dibagi sisa hari.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tanggal Awal Periode Budget (1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={startDayInput}
                    onChange={(e) => setStartDayInput(e.target.value)}
                    className="w-full text-base px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Misal gajian tanggal 25, maka periode dihitung tiap tanggal 25 s/d 24 bulan berikutnya.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingBudget}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/30 transition-transform active:scale-95 disabled:opacity-50 text-sm"
                >
                  {savingBudget ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>

            {/* Daftar Kategori */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Kategori Pengeluaran</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 border border-slate-100"
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WHATSAPP GUIDE */}
        {activeTab === 'whatsapp' && (
          <div className="animate-in fade-in duration-200">
            <WhatsAppGuideModal />
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onSuccess={fetchData}
        phone={currentPhone}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />
    </MobileContainer>
  );
}
