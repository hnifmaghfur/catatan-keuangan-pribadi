import { differenceInCalendarDays } from 'date-fns';
import { BudgetSummary } from '@/types';

/**
 * Calculates start and end dates for a user's budget cycle based on custom startDay (1-31).
 * E.g., if startDay = 25 and today is 31 Oct:
 *   Period: 25 Oct to 24 Nov.
 * If startDay = 1 and today is 31 Oct:
 *   Period: 1 Oct to 31 Oct.
 */
export function getBudgetPeriod(startDay: number = 1, referenceDate: Date = new Date()): { periodStart: Date; periodEnd: Date } {
  const safeStartDay = Math.max(1, Math.min(31, startDay));
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (day >= safeStartDay) {
    periodStart = new Date(year, month, safeStartDay);
    // Period ends on safeStartDay - 1 of next month
    if (safeStartDay === 1) {
      // Last day of current month
      periodEnd = new Date(year, month + 1, 0);
    } else {
      periodEnd = new Date(year, month + 1, safeStartDay - 1);
    }
  } else {
    // Before budget start day: period started previous month
    periodStart = new Date(year, month - 1, safeStartDay);
    if (safeStartDay === 1) {
      periodEnd = new Date(year, month, 0);
    } else {
      periodEnd = new Date(year, month, safeStartDay - 1);
    }
  }

  // Normalize time to start of day and end of day
  periodStart.setHours(0, 0, 0, 0);
  periodEnd.setHours(23, 59, 59, 999);

  return { periodStart, periodEnd };
}

/**
 * Calculates remaining daily budget estimate.
 * Formula: (Remaining Budget) / (Remaining Days in Period including Today)
 */
export function calculateDailyEstimate(
  budgetAmount: number,
  totalSpent: number,
  periodEnd: Date,
  today: Date = new Date()
): { dailyEstimate: number; remainingDays: number; remainingBudget: number } {
  const remainingBudget = Math.max(0, budgetAmount - totalSpent);
  
  // Calculate remaining days including today
  const diffDays = differenceInCalendarDays(periodEnd, today);
  const remainingDays = Math.max(1, diffDays + 1);

  if (remainingBudget <= 0) {
    return {
      dailyEstimate: 0,
      remainingDays,
      remainingBudget: 0,
    };
  }

  const dailyEstimate = Math.floor(remainingBudget / remainingDays);

  return {
    dailyEstimate,
    remainingDays,
    remainingBudget,
  };
}

/**
 * Computes full budget summary metrics
 */
export function computeBudgetSummary({
  monthlyBudget,
  totalSpent,
  todaySpent,
  budgetStartDay = 1,
  referenceDate = new Date(),
}: {
  monthlyBudget: number;
  totalSpent: number;
  todaySpent: number;
  budgetStartDay?: number;
  referenceDate?: Date;
}): BudgetSummary {
  const { periodStart, periodEnd } = getBudgetPeriod(budgetStartDay, referenceDate);
  const { dailyEstimate, remainingDays, remainingBudget } = calculateDailyEstimate(
    monthlyBudget,
    totalSpent,
    periodEnd,
    referenceDate
  );

  const percentSpent = monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;
  const isOverBudget = totalSpent > monthlyBudget;

  const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

  return {
    monthlyBudget,
    totalSpent,
    remainingBudget,
    todaySpent,
    dailyEstimate,
    remainingDays,
    periodStart: formatDateStr(periodStart),
    periodEnd: formatDateStr(periodEnd),
    percentSpent,
    isOverBudget,
  };
}
