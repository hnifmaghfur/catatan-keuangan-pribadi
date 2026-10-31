export interface User {
  id: string;
  phone_number: string;
  name: string;
  monthly_budget: number;
  budget_start_day: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  source: 'web' | 'whatsapp';
  transaction_date: string;
  created_at: string;
  categories?: {
    name: string;
    emoji: string;
  } | null;
}

export interface BudgetSummary {
  monthlyBudget: number;
  totalSpent: number;
  remainingBudget: number;
  todaySpent: number;
  dailyEstimate: number;
  remainingDays: number;
  periodStart: string;
  periodEnd: string;
  percentSpent: number;
  isOverBudget: boolean;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  emoji: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DailySpendingPoint {
  date: string;
  dayName: string;
  amount: number;
}
