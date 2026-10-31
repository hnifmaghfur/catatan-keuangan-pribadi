'use client';

import React from 'react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { BudgetSummary } from '@/types';
import { Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

interface SummaryCardProps {
  summary: BudgetSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const percent = Math.min(100, Math.max(0, summary.percentSpent));
  const isDanger = percent > 85;

  return (
    <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center text-xs text-emerald-100/90 mb-3">
        <span className="flex items-center gap-1.5 font-medium">
          <Wallet className="w-3.5 h-3.5" />
          Sisa Budget Periode Ini
        </span>
        <span className="bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-[11px]">
          {formatDateIndo(summary.periodStart)} - {formatDateIndo(summary.periodEnd)}
        </span>
      </div>

      <div className="mb-4">
        <h2 className="text-3xl font-extrabold tracking-tight">
          {formatRupiah(summary.remainingBudget)}
        </h2>
        <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1">
          {summary.isOverBudget ? (
            <span className="text-rose-300 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Over budget! Melebihi batas anggaran
            </span>
          ) : (
            <span>Tersisa {summary.remainingDays} hari dalam siklus budget</span>
          )}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-emerald-100 font-medium">
          <span>Terpakai: {formatRupiah(summary.totalSpent)}</span>
          <span>{percent}%</span>
        </div>
        <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isDanger ? 'bg-rose-400' : 'bg-emerald-300'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-emerald-200/80 pt-0.5">
          <span>Target Budget: {formatRupiah(summary.monthlyBudget)}</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {summary.remainingDays} hari tersisa
          </span>
        </div>
      </div>
    </div>
  );
}
