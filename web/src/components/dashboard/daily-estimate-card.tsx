'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils';
import { BudgetSummary } from '@/types';
import { Sparkles, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface DailyEstimateCardProps {
  summary: BudgetSummary;
}

export function DailyEstimateCard({ summary }: DailyEstimateCardProps) {
  const isWithinBudget = summary.todaySpent <= summary.dailyEstimate;
  const diff = Math.abs(summary.dailyEstimate - summary.todaySpent);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Analisis Penggunaan Harian</h3>
            <p className="text-[11px] text-slate-400">Dihitung otomatis dari sisa budget / hari</p>
          </div>
        </div>

        {summary.dailyEstimate > 0 && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              isWithinBudget
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isWithinBudget ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Kuota Aman
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" /> Melebihi Kuota
              </>
            )}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Kolom 1: Penggunaan Hari Ini */}
        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">
            Penggunaan Hari Ini
          </span>
          <div className="text-lg font-extrabold text-slate-800">
            {formatRupiah(summary.todaySpent)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Total transaksi hari ini</p>
        </div>

        {/* Kolom 2: Estimasi Penggunaan Harian */}
        <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-100/80">
          <span className="text-[11px] font-medium text-emerald-700 block mb-1">
            Estimasi Kuota Harian
          </span>
          <div className="text-lg font-extrabold text-emerald-800">
            {formatRupiah(summary.dailyEstimate)}
          </div>
          <p className="text-[10px] text-emerald-600/80 mt-0.5">
            Batas pengeluaran aman / hari
          </p>
        </div>
      </div>

      {/* Insight banner */}
      <div className="text-xs rounded-xl p-3 bg-slate-50 flex items-start gap-2 text-slate-600 border border-slate-100">
        <Calendar className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          {summary.dailyEstimate <= 0 ? (
            <p>Budget periode ini telah habis. Segera sesuaikan target budget Anda.</p>
          ) : isWithinBudget ? (
            <p>
              Hebat! Pengeluaran hari ini masih tersisa{' '}
              <strong className="text-emerald-700 font-semibold">{formatRupiah(diff)}</strong> dari estimasi batas harian.
            </p>
          ) : (
            <p>
              Hari ini pengeluaran Anda melebihi estimasi sebesar{' '}
              <strong className="text-rose-600 font-semibold">{formatRupiah(diff)}</strong>. Kuota harian untuk hari-hari berikutnya akan otomatis disesuaikan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
