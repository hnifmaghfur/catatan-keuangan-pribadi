'use client';

import React from 'react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { Transaction } from '@/types';
import { MessageSquare, Globe, ArrowUpRight } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  onDelete?: (id: string) => void;
}

export function RecentTransactions({
  transactions,
  onViewAll,
  onDelete,
}: RecentTransactionsProps) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Transaksi Terkini</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
          >
            Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <p className="text-sm">Belum ada transaksi</p>
          <p className="text-xs mt-1">Catat via WhatsApp atau tombol (+) di bawah</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.slice(0, 5).map((tx) => {
            const emoji = tx.categories?.emoji || '📦';
            const catName = tx.categories?.name || 'Lainnya';
            const isWA = tx.source === 'whatsapp';

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between group hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                    {emoji}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">
                      {tx.description}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span>{catName}</span>
                      <span>•</span>
                      <span>{formatDateIndo(tx.transaction_date)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {isWA ? (
                          <>
                            <MessageSquare className="w-2.5 h-2.5 text-emerald-600" /> WA
                          </>
                        ) : (
                          <>
                            <Globe className="w-2.5 h-2.5 text-blue-500" /> Web
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800">
                    -{formatRupiah(tx.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
