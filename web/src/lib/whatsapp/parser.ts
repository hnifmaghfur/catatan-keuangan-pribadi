export interface ParsedTransaction {
  amount: number;
  description: string;
  category?: string;
}

export type CommandType =
  | 'transaction'
  | 'daily_summary'
  | 'weekly_summary'
  | 'monthly_summary'
  | 'budget_status'
  | 'categories_breakdown'
  | 'history'
  | 'delete_last'
  | 'set_budget'
  | 'help'
  | 'unknown';

export interface ParsedMessage {
  type: CommandType;
  transaction?: ParsedTransaction;
  budgetAmount?: number;
  rawText: string;
}

/**
 * Normalizes text and parses Indonesian currency multipliers like "25k", "1.5jt", "50.000"
 */
export function parseNominal(rawNominal: string): number | null {
  const clean = rawNominal.trim().toLowerCase().replace(/\s+/g, '');

  // Handle 'jt' or 'juta' multiplier
  const jtMatch = clean.match(/^(\d+(?:[.,]\d+)?)(?:jt|juta)$/);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(',', '.'));
    return isNaN(num) ? null : Math.round(num * 1_000_000);
  }

  // Handle 'k' or 'rb' or 'ribu' multiplier
  const kMatch = clean.match(/^(\d+(?:[.,]\d+)?)(?:k|rb|ribu)$/);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(',', '.'));
    return isNaN(num) ? null : Math.round(num * 1_000);
  }

  // Handle plain numbers with dot/comma thousand separators
  const digitsOnly = clean.replace(/[.,]/g, '');
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parses incoming WhatsApp message into actionable commands or expense transactions.
 */
export function parseWhatsAppMessage(message: string): ParsedMessage {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Help Commands
  if (['bantuan', 'help', 'menu', 'panduan'].includes(lower)) {
    return { type: 'help', rawText: text };
  }

  // 2. Query Commands
  if (['hari ini', 'today', 'harian'].includes(lower)) {
    return { type: 'daily_summary', rawText: text };
  }
  if (['minggu ini', 'weekly', 'mingguan'].includes(lower)) {
    return { type: 'weekly_summary', rawText: text };
  }
  if (['bulan ini', 'monthly', 'bulanan'].includes(lower)) {
    return { type: 'monthly_summary', rawText: text };
  }
  if (['budget', 'anggaran', 'sisa budget'].includes(lower)) {
    return { type: 'budget_status', rawText: text };
  }
  if (['kategori', 'category', 'categories'].includes(lower)) {
    return { type: 'categories_breakdown', rawText: text };
  }
  if (['riwayat', 'history', 'terakhir'].includes(lower)) {
    return { type: 'history', rawText: text };
  }
  if (['hapus terakhir', 'batal', 'delete last'].includes(lower)) {
    return { type: 'delete_last', rawText: text };
  }

  // 3. Set Budget Command: "set budget 3000000" or "set budget 3jt"
  const setBudgetMatch = lower.match(/^set\s+budget\s+(.+)$/);
  if (setBudgetMatch) {
    const amount = parseNominal(setBudgetMatch[1]);
    if (amount && amount > 0) {
      return { type: 'set_budget', budgetAmount: amount, rawText: text };
    }
  }

  // 4. Expense Transaction Matching
  // Regex matches formats:
  // "25000 nasi goreng #makan"
  // "25k nasi goreng #makan"
  // "1.5jt sewa kos #tagihan"
  // "50000 bensin"
  const txRegex = /^(\d+[\d.,]*(?:k|rb|ribu|jt|juta)?)\s+(.+?)(?:\s+#(\S+))?$/i;
  const txMatch = text.match(txRegex);

  if (txMatch) {
    const amount = parseNominal(txMatch[1]);
    const description = txMatch[2].trim();
    const category = txMatch[3] ? txMatch[3].trim() : undefined;

    if (amount !== null && amount > 0 && description) {
      return {
        type: 'transaction',
        transaction: {
          amount,
          description,
          category,
        },
        rawText: text,
      };
    }
  }

  return { type: 'unknown', rawText: text };
}
