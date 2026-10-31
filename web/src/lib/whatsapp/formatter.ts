import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { BudgetSummary, Transaction } from '@/types';

/**
 * Formats notification for successfully saved transaction
 */
export function formatTransactionSuccess({
  amount,
  description,
  categoryName,
  categoryEmoji,
  todaySpent,
  dailyEstimate,
}: {
  amount: number;
  description: string;
  categoryName: string;
  categoryEmoji: string;
  todaySpent: number;
  dailyEstimate: number;
}): string {
  const lines = [
    `✅ *Tercatat!*`,
    `📝 ${description} — *${formatRupiah(amount)}*`,
    `🏷️ Kategori: ${categoryEmoji} ${categoryName}`,
    `📅 ${formatDateIndo(new Date())}`,
    ``,
    `📊 Pengeluaran hari ini: *${formatRupiah(todaySpent)}*`,
    `💡 Estimasi aman harian: *${formatRupiah(dailyEstimate)}/hari*`,
  ];

  if (dailyEstimate > 0 && todaySpent > dailyEstimate) {
    lines.push(`⚠️ _Perhatian: Pengeluaran hari ini sudah melebihi estimasi harian._`);
  }

  return lines.join('\n');
}

/**
 * Formats Daily Summary report
 */
export function formatDailySummary({
  todaySpent,
  dailyEstimate,
  transactions,
}: {
  todaySpent: number;
  dailyEstimate: number;
  transactions: Array<{ description: string; amount: number; emoji?: string }>;
}): string {
  const lines = [
    `📊 *Ringkasan Hari Ini (${formatDateIndo(new Date())})*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `💸 *Total: ${formatRupiah(todaySpent)}* (${transactions.length} transaksi)`,
    ``,
  ];

  if (transactions.length > 0) {
    lines.push(`*Rincian:*`);
    transactions.slice(0, 10).forEach((t) => {
      lines.push(`${t.emoji || '📦'} ${t.description}: ${formatRupiah(t.amount)}`);
    });
    lines.push(``);
  }

  lines.push(`💰 Estimasi aman: *${formatRupiah(dailyEstimate)}/hari*`);
  
  if (dailyEstimate > 0) {
    if (todaySpent <= dailyEstimate) {
      lines.push(`📈 Status: ✅ *Aman (Di bawah estimasi)*`);
    } else {
      lines.push(`📈 Status: ⚠️ *Melebihi estimasi harian*`);
    }
  }

  return lines.join('\n');
}

/**
 * Formats Budget & Estimation Status report
 */
export function formatBudgetStatus(summary: BudgetSummary): string {
  const lines = [
    `💰 *Status Budget & Estimasi Harian*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📋 Budget Periode: *${formatRupiah(summary.monthlyBudget)}*`,
    `💸 Terpakai: *${formatRupiah(summary.totalSpent)}* (${summary.percentSpent}%)`,
    `💵 Sisa Budget: *${formatRupiah(summary.remainingBudget)}*`,
    `📅 Sisa Hari: *${summary.remainingDays} hari*`,
    ``,
    `🎯 *Estimasi Penggunaan Harian:*`,
    `👉 *${formatRupiah(summary.dailyEstimate)} / hari*`,
    ``,
    `ℹ️ _Periode: ${formatDateIndo(summary.periodStart)} s/d ${formatDateIndo(summary.periodEnd)}_`,
  ];

  return lines.join('\n');
}

/**
 * Formats Category Breakdown report
 */
export function formatCategoryBreakdown(
  categories: Array<{ name: string; emoji: string; total: number; percentage: number }>
): string {
  if (categories.length === 0) {
    return `📁 *Breakdown Kategori*\n\nBelum ada pengeluaran pada periode ini.`;
  }

  const lines = [
    `📁 *Pengeluaran per Kategori*`,
    `━━━━━━━━━━━━━━━━━━━`,
  ];

  categories.forEach((cat) => {
    lines.push(`${cat.emoji} *${cat.name}*: ${formatRupiah(cat.total)} (${cat.percentage}%)`);
  });

  return lines.join('\n');
}

/**
 * Formats Recent History list
 */
export function formatHistoryList(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return `📋 *Riwayat Transaksi*\n\nBelum ada transaksi yang tercatat.`;
  }

  const lines = [
    `📋 *10 Transaksi Terakhir*`,
    `━━━━━━━━━━━━━━━━━━━`,
  ];

  transactions.forEach((tx) => {
    const emoji = tx.categories?.emoji || '📦';
    const catName = tx.categories?.name || 'Lainnya';
    lines.push(
      `${emoji} *${formatRupiah(tx.amount)}* — ${tx.description}\n   _(${catName} • ${formatDateIndo(tx.transaction_date)})_`
    );
  });

  return lines.join('\n');
}

/**
 * Formats Help Guide
 */
export function formatHelpMessage(): string {
  return [
    `📒 *Panduan Catatan Keuangan Pribadi*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `*1. Catat Pengeluaran:*`,
    `• \`25000 nasi goreng #makan\``,
    `• \`15k es kopi #makan\``,
    `• \`50rb bensin #transport\``,
    `• \`1.2jt bayar kos #tagihan\``,
    `• \`20000 parkir\` (otomatis kategori Lainnya)`,
    ``,
    `*2. Periksa Pengeluaran & Estimasi:*`,
    `• *hari ini* / *today* : Total hari ini & estimasi`,
    `• *budget* : Sisa budget & kuota per hari`,
    `• *minggu ini* : Pengeluaran 7 hari terakhir`,
    `• *kategori* : Rincian per pos pengeluaran`,
    `• *riwayat* : 10 catatan terakhir`,
    ``,
    `*3. Perintah Cepat:*`,
    `• *set budget 3jt* : Atur target budget bulanan`,
    `• *hapus terakhir* : Batalkan catatan terakhir`,
    `• *bantuan* : Tampilkan menu ini`,
  ].join('\n');
}
