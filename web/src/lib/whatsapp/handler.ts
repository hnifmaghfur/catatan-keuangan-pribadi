import { getAdminClient } from '@/lib/supabase/admin';
import { parseWhatsAppMessage } from '@/lib/whatsapp/parser';
import {
  formatTransactionSuccess,
  formatDailySummary,
  formatBudgetStatus,
  formatCategoryBreakdown,
  formatHistoryList,
  formatHelpMessage,
} from '@/lib/whatsapp/formatter';
import { computeBudgetSummary, getBudgetPeriod } from '@/lib/calculations';
import { User, Category, Transaction } from '@/types';

/**
 * Normalizes phone numbers (e.g. 62812345678 or +62812345678 or 0812345678 -> 62812345678)
 */
export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Ensures user exists in Supabase. If not found, creates user and seeds initial categories.
 */
export async function getOrCreateUser(phone: string): Promise<User> {
  const supabase = getAdminClient();
  const normalizedPhone = normalizePhoneNumber(phone);

  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', normalizedPhone)
    .single();

  if (existingUser && !selectError) {
    return existingUser as User;
  }

  // Create new user
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      phone_number: normalizedPhone,
      name: `User ${normalizedPhone.slice(-4)}`,
      monthly_budget: 3000000, // Default 3 million IDR budget
      budget_start_day: 1,
    })
    .select('*')
    .single();

  if (insertError || !newUser) {
    throw new Error(`Failed to create user: ${insertError?.message}`);
  }

  // Ensure default categories exist
  try {
    const { error: rpcError } = await supabase.rpc('seed_default_categories', { p_user_id: newUser.id });
    if (rpcError) {
      throw rpcError;
    }
  } catch {
    // Fallback if rpc is not available
    const defaults = [
      { user_id: newUser.id, name: 'Makan', emoji: '🍔' },
      { user_id: newUser.id, name: 'Transport', emoji: '🚗' },
      { user_id: newUser.id, name: 'Belanja', emoji: '🛒' },
      { user_id: newUser.id, name: 'Hiburan', emoji: '🎮' },
      { user_id: newUser.id, name: 'Tagihan', emoji: '📄' },
      { user_id: newUser.id, name: 'Lainnya', emoji: '📦' },
    ];
    await supabase.from('categories').upsert(defaults, { onConflict: 'user_id,name' });
  }

  return newUser as User;
}

/**
 * Main WhatsApp webhook processing engine.
 */
export async function handleIncomingWhatsApp({
  from,
  message,
}: {
  from: string;
  message: string;
}): Promise<string> {
  const user = await getOrCreateUser(from);
  const parsed = parseWhatsAppMessage(message);
  const supabase = getAdminClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const { periodStart, periodEnd } = getBudgetPeriod(user.budget_start_day || 1);
  const periodStartStr = periodStart.toISOString().split('T')[0];
  const periodEndStr = periodEnd.toISOString().split('T')[0];

  switch (parsed.type) {
    case 'help': {
      return formatHelpMessage();
    }

    case 'set_budget': {
      const newBudget = parsed.budgetAmount || 0;
      await supabase
        .from('users')
        .update({ monthly_budget: newBudget, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      return `✅ Target budget bulanan Anda berhasil diubah menjadi *Rp ${newBudget.toLocaleString('id-ID')}*!\n\nKetik *budget* untuk melihat simulasi kuota harian.`;
    }

    case 'transaction': {
      const tx = parsed.transaction!;
      let categoryId: string | null = null;
      let categoryName = 'Lainnya';
      let categoryEmoji = '📦';

      // Look up user categories
      const { data: userCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      const categories = (userCategories || []) as Category[];

      if (tx.category) {
        const found = categories.find(
          (c) => c.name.toLowerCase() === tx.category!.toLowerCase()
        );
        if (found) {
          categoryId = found.id;
          categoryName = found.name;
          categoryEmoji = found.emoji;
        } else {
          // Create new category if user entered a custom hashtag
          const { data: newCat } = await supabase
            .from('categories')
            .insert({
              user_id: user.id,
              name: tx.category.charAt(0).toUpperCase() + tx.category.slice(1),
              emoji: '🏷️',
            })
            .select()
            .single();

          if (newCat) {
            categoryId = newCat.id;
            categoryName = newCat.name;
            categoryEmoji = newCat.emoji;
          }
        }
      } else {
        const defaultCat = categories.find((c) => c.name.toLowerCase() === 'lainnya');
        if (defaultCat) {
          categoryId = defaultCat.id;
          categoryName = defaultCat.name;
          categoryEmoji = defaultCat.emoji;
        }
      }

      // Insert transaction
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        category_id: categoryId,
        amount: tx.amount,
        description: tx.description,
        source: 'whatsapp',
        transaction_date: todayStr,
      });

      if (txError) {
        console.error('Error inserting transaction:', txError);
        return '⚠️ Gagal menyimpan transaksi. Silakan coba lagi.';
      }

      // Query sum for period & today
      const { data: periodTxs } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', user.id)
        .gte('transaction_date', periodStartStr)
        .lte('transaction_date', periodEndStr);

      const totalSpent = (periodTxs || []).reduce((sum, item) => sum + Number(item.amount), 0);
      const todaySpent = (periodTxs || [])
        .filter((item) => item.transaction_date === todayStr)
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const summary = computeBudgetSummary({
        monthlyBudget: Number(user.monthly_budget || 0),
        totalSpent,
        todaySpent,
        budgetStartDay: user.budget_start_day || 1,
      });

      return formatTransactionSuccess({
        amount: tx.amount,
        description: tx.description,
        categoryName,
        categoryEmoji,
        todaySpent,
        dailyEstimate: summary.dailyEstimate,
      });
    }

    case 'daily_summary': {
      const { data: todayTxs } = await supabase
        .from('transactions')
        .select('amount, description, categories(name, emoji)')
        .eq('user_id', user.id)
        .eq('transaction_date', todayStr);

      const items = ((todayTxs || []) as unknown) as Array<{
        amount: number;
        description: string;
        categories?: { name: string; emoji: string } | null;
      }>;

      const todaySpent = items.reduce((sum, item) => sum + Number(item.amount), 0);

      const { data: periodTxs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .gte('transaction_date', periodStartStr)
        .lte('transaction_date', periodEndStr);

      const totalSpent = (periodTxs || []).reduce((sum, item) => sum + Number(item.amount), 0);

      const summary = computeBudgetSummary({
        monthlyBudget: Number(user.monthly_budget || 0),
        totalSpent,
        todaySpent,
        budgetStartDay: user.budget_start_day || 1,
      });

      return formatDailySummary({
        todaySpent,
        dailyEstimate: summary.dailyEstimate,
        transactions: items.map((i) => ({
          description: i.description,
          amount: Number(i.amount),
          emoji: i.categories?.emoji,
        })),
      });
    }

    case 'budget_status':
    case 'monthly_summary': {
      const { data: periodTxs } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', user.id)
        .gte('transaction_date', periodStartStr)
        .lte('transaction_date', periodEndStr);

      const totalSpent = (periodTxs || []).reduce((sum, item) => sum + Number(item.amount), 0);
      const todaySpent = (periodTxs || [])
        .filter((item) => item.transaction_date === todayStr)
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const summary = computeBudgetSummary({
        monthlyBudget: Number(user.monthly_budget || 0),
        totalSpent,
        todaySpent,
        budgetStartDay: user.budget_start_day || 1,
      });

      return formatBudgetStatus(summary);
    }

    case 'categories_breakdown': {
      const { data: rawTxs } = await supabase
        .from('transactions')
        .select('amount, category_id, categories(name, emoji)')
        .eq('user_id', user.id)
        .gte('transaction_date', periodStartStr)
        .lte('transaction_date', periodEndStr);

      const txList = ((rawTxs || []) as unknown) as Array<{
        amount: number;
        category_id: string | null;
        categories?: { name: string; emoji: string } | null;
      }>;

      const totalSpent = txList.reduce((sum, t) => sum + Number(t.amount), 0);
      const catMap = new Map<string, { name: string; emoji: string; total: number }>();

      txList.forEach((t) => {
        const name = t.categories?.name || 'Lainnya';
        const emoji = t.categories?.emoji || '📦';
        const curr = catMap.get(name) || { name, emoji, total: 0 };
        curr.total += Number(t.amount);
        catMap.set(name, curr);
      });

      const categoriesResult = Array.from(catMap.values())
        .sort((a, b) => b.total - a.total)
        .map((c) => ({
          ...c,
          percentage: totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0,
        }));

      return formatCategoryBreakdown(categoriesResult);
    }

    case 'history': {
      const { data: historyTxs } = await supabase
        .from('transactions')
        .select('id, user_id, category_id, amount, description, source, transaction_date, created_at, categories(name, emoji)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      return formatHistoryList((historyTxs || []) as unknown as Transaction[]);
    }

    case 'delete_last': {
      const { data: lastTx } = await supabase
        .from('transactions')
        .select('id, description, amount')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastTx) {
        return '⚠️ Tidak ada transaksi yang dapat dibatalkan.';
      }

      await supabase.from('transactions').delete().eq('id', lastTx.id);

      return `🗑️ Transaksi terakhir berhasil dihapus:\n"${lastTx.description}" seharga Rp ${Number(lastTx.amount).toLocaleString('id-ID')}.`;
    }

    default: {
      return (
        `❓ Pesan tidak dikenali: "${parsed.rawText}"\n\n` +
        `Untuk mencatat pengeluaran, ketik nominal diikuti deskripsi:\n` +
        `Contoh: *25000 nasi goreng #makan*\n\n` +
        `Ketik *bantuan* untuk melihat daftar perintah lengkap.`
      );
    }
  }
}
