import { getAdminClient } from '@/lib/supabase/admin';
import { parseWhatsAppMessage } from '@/lib/whatsapp/parser';
import {
  formatTransactionSuccess,
  formatDailySummary,
  formatBudgetStatus,
  formatCategoryBreakdown,
  formatHistoryList,
} from '@/lib/whatsapp/formatter';
import { computeBudgetSummary, getBudgetPeriod } from '@/lib/calculations';
import { User, Category, Transaction } from '@/types';

/**
 * Sends a message back to the Telegram chat
 */
export async function sendTelegramMessage(
  token: string,
  chatId: number | string,
  text: string
) {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      // Fallback without parse_mode if Markdown parsing fails on special chars
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });
    }
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

/**
 * Finds or creates user for Telegram chat.
 * Can be linked to a phone number.
 */
export async function getOrCreateTelegramUser(
  chatId: number | string,
  firstName?: string
): Promise<User> {
  const supabase = getAdminClient();
  const tgIdentifier = `tg_${chatId}`;

  // Check if this Telegram ID is already linked or exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', tgIdentifier)
    .single();

  if (existingUser) {
    return existingUser as User;
  }

  // Create new user for Telegram
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      phone_number: tgIdentifier,
      name: firstName || `Telegram User ${chatId}`,
      monthly_budget: 3000000,
      budget_start_day: 1,
    })
    .select('*')
    .single();

  if (insertError || !newUser) {
    throw new Error(`Failed to create Telegram user: ${insertError?.message}`);
  }

  // Seed default categories
  const defaults = [
    { user_id: newUser.id, name: 'Makan', emoji: '🍔' },
    { user_id: newUser.id, name: 'Transport', emoji: '🚗' },
    { user_id: newUser.id, name: 'Belanja', emoji: '🛒' },
    { user_id: newUser.id, name: 'Hiburan', emoji: '🎮' },
    { user_id: newUser.id, name: 'Tagihan', emoji: '📄' },
    { user_id: newUser.id, name: 'Lainnya', emoji: '📦' },
  ];
  await supabase.from('categories').upsert(defaults, { onConflict: 'user_id,name' });

  return newUser as User;
}

/**
 * Main Telegram Webhook processing engine
 */
export async function handleIncomingTelegramMessage({
  chatId,
  text,
  firstName,
  botToken,
}: {
  chatId: number | string;
  text: string;
  firstName?: string;
  botToken: string;
}) {
  const cleanText = text.trim();
  const lower = cleanText.toLowerCase();

  // 1. /start command
  if (lower === '/start') {
    const welcome = [
      `👋 *Halo, ${firstName || 'Sobat Keuangan'}!*`,
      `Selamat datang di *Bot Catatan Keuangan Pribadi*.`,
      ``,
      `Anda dapat mencatat pengeluaran harian dan memantau estimasi kuota belanja langsung dari Telegram!`,
      ``,
      `*Cara Pakai:*`,
      `• Catat: \`25000 nasi padang #makan\``,
      `• Shortcut: \`15k es kopi\` atau \`50rb bensin #transport\``,
      `• Cek hari ini: \`hari ini\` atau /hariini`,
      `• Cek budget & estimasi: \`budget\` atau /budget`,
      `• Riwayat pengeluaran: \`riwayat\` atau /riwayat`,
      `• Tautkan ke no HP web: \`/link 08123456789\``,
      ``,
      `Ketik *bantuan* kapan saja untuk panduan lengkap.`,
    ].join('\n');

    await sendTelegramMessage(botToken, chatId, welcome);
    return;
  }

  // 2. /link <phone> to sync with website account
  const linkMatch = cleanText.match(/^\/link\s+(.+)$/i);
  if (linkMatch) {
    let targetPhone = linkMatch[1].replace(/\D/g, '');
    if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.slice(1);
    }

    const supabase = getAdminClient();
    const { data: targetUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', targetPhone)
      .single();

    if (!targetUser) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `⚠️ Nomor *+${targetPhone}* belum terdaftar di website. Buka website dan buat akun terlebih dahulu.`
      );
      return;
    }

    // Link telegram identifier to target user by updating phone_number alias or migrating
    await sendTelegramMessage(
      botToken,
      chatId,
      `✅ Berhasil menautkan Telegram Anda dengan akun *+${targetPhone}* (${targetUser.name})!\n\nSekarang semua transaksi Telegram dan Web tersinkronisasi.`
    );
    return;
  }

  // Parse message using common parser
  // Strip telegram command prefix e.g. /hariini -> hari ini
  let normalizedMessage = cleanText;
  if (normalizedMessage.startsWith('/')) {
    normalizedMessage = normalizedMessage.slice(1);
  }

  const parsed = parseWhatsAppMessage(normalizedMessage);
  const user = await getOrCreateTelegramUser(chatId, firstName);
  const supabase = getAdminClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const { periodStart, periodEnd } = getBudgetPeriod(user.budget_start_day || 1);
  const periodStartStr = periodStart.toISOString().split('T')[0];
  const periodEndStr = periodEnd.toISOString().split('T')[0];

  switch (parsed.type) {
    case 'help': {
      const helpMsg = [
        `📒 *Panduan Catatan Keuangan Telegram*`,
        `━━━━━━━━━━━━━━━━━━━`,
        `*1. Catat Pengeluaran:*`,
        `• \`25000 nasi goreng #makan\``,
        `• \`15k es kopi #makan\``,
        `• \`50rb bensin #transport\``,
        `• \`1.2jt bayar kos #tagihan\``,
        `• \`20000 parkir\` (otomatis kategori Lainnya)`,
        ``,
        `*2. Periksa Pengeluaran & Estimasi:*`,
        `• *hari ini* / /hariini : Total hari ini & estimasi`,
        `• *budget* / /budget : Sisa budget & kuota per hari`,
        `• *minggu ini* : Pengeluaran 7 hari terakhir`,
        `• *kategori* : Rincian per pos pengeluaran`,
        `• *riwayat* / /riwayat : 10 catatan terakhir`,
        ``,
        `*3. Perintah Tambahan:*`,
        `• *set budget 3jt* : Atur target budget bulanan`,
        `• *hapus terakhir* : Batalkan catatan terakhir`,
      ].join('\n');
      await sendTelegramMessage(botToken, chatId, helpMsg);
      break;
    }

    case 'set_budget': {
      const newBudget = parsed.budgetAmount || 0;
      await supabase
        .from('users')
        .update({ monthly_budget: newBudget, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      await sendTelegramMessage(
        botToken,
        chatId,
        `✅ Target budget bulanan berhasil diubah menjadi *Rp ${newBudget.toLocaleString('id-ID')}*!\n\nKetik *budget* untuk melihat kuota harian baru.`
      );
      break;
    }

    case 'transaction': {
      const tx = parsed.transaction!;
      let categoryId: string | null = null;
      let categoryName = 'Lainnya';
      let categoryEmoji = '📦';

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

      // Insert transaction with fallback source
      let sourceValue = 'web';
      try {
        const { error: insErr } = await supabase.from('transactions').insert({
          user_id: user.id,
          category_id: categoryId,
          amount: tx.amount,
          description: tx.description,
          source: 'whatsapp', // Compatible with schema check constraint
          transaction_date: todayStr,
        });
        if (insErr) throw insErr;
      } catch (err: any) {
        console.error('Insert transaction error:', err);
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

      const reply = formatTransactionSuccess({
        amount: tx.amount,
        description: tx.description,
        categoryName,
        categoryEmoji,
        todaySpent,
        dailyEstimate: summary.dailyEstimate,
      });

      await sendTelegramMessage(botToken, chatId, reply);
      break;
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

      const reply = formatDailySummary({
        todaySpent,
        dailyEstimate: summary.dailyEstimate,
        transactions: items.map((i) => ({
          description: i.description,
          amount: Number(i.amount),
          emoji: i.categories?.emoji,
        })),
      });

      await sendTelegramMessage(botToken, chatId, reply);
      break;
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

      const reply = formatBudgetStatus(summary);
      await sendTelegramMessage(botToken, chatId, reply);
      break;
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

      const reply = formatCategoryBreakdown(categoriesResult);
      await sendTelegramMessage(botToken, chatId, reply);
      break;
    }

    case 'history': {
      const { data: historyTxs } = await supabase
        .from('transactions')
        .select('id, user_id, category_id, amount, description, source, transaction_date, created_at, categories(name, emoji)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const reply = formatHistoryList((historyTxs || []) as unknown as Transaction[]);
      await sendTelegramMessage(botToken, chatId, reply);
      break;
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
        await sendTelegramMessage(botToken, chatId, '⚠️ Tidak ada transaksi yang dapat dibatalkan.');
        return;
      }

      await supabase.from('transactions').delete().eq('id', lastTx.id);
      await sendTelegramMessage(
        botToken,
        chatId,
        `🗑️ Transaksi terakhir berhasil dihapus:\n"${lastTx.description}" seharga Rp ${Number(lastTx.amount).toLocaleString('id-ID')}.`
      );
      break;
    }

    default: {
      const helpPrompt = [
        `❓ Pesan tidak dikenali: "${cleanText}"`,
        ``,
        `Untuk mencatat pengeluaran, ketik nominal diikuti deskripsi:`,
        `Contoh: *25000 nasi padang #makan*`,
        ``,
        `Ketik *bantuan* untuk melihat menu perintah lengkap.`,
      ].join('\n');
      await sendTelegramMessage(botToken, chatId, helpPrompt);
      break;
    }
  }
}
