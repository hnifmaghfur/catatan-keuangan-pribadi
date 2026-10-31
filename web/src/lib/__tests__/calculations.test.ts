import {
  getBudgetPeriod,
  calculateDailyEstimate,
  computeBudgetSummary,
} from '../calculations';
import { parseNominal, parseWhatsAppMessage } from '../whatsapp/parser';

// Simple lightweight test runner
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running Calculations & WhatsApp Parser Tests...\n');

// 1. Test parseNominal
assert(parseNominal('25000') === 25000, '25000 should parse to 25000');
assert(parseNominal('25k') === 25000, '25k should parse to 25000');
assert(parseNominal('50rb') === 50000, '50rb should parse to 50000');
assert(parseNominal('1.5jt') === 1500000, '1.5jt should parse to 1500000');
assert(parseNominal('3jt') === 3000000, '3jt should parse to 3000000');
assert(parseNominal('50.000') === 50000, '50.000 should parse to 50000');
console.log('✓ parseNominal tests passed');

// 2. Test parseWhatsAppMessage
const tx1 = parseWhatsAppMessage('25000 nasi padang #makan');
assert(tx1.type === 'transaction', 'Should identify transaction');
assert(tx1.transaction?.amount === 25000, 'Amount should be 25000');
assert(tx1.transaction?.description === 'nasi padang', 'Description match');
assert(tx1.transaction?.category === 'makan', 'Category match');

const tx2 = parseWhatsAppMessage('50k bensin pertalite');
assert(tx2.type === 'transaction', 'Should parse transaction without hashtag');
assert(tx2.transaction?.amount === 50000, 'Amount should be 50000');
assert(tx2.transaction?.category === undefined, 'Category should be undefined');

const qToday = parseWhatsAppMessage('hari ini');
assert(qToday.type === 'daily_summary', 'Should parse daily_summary');

const qBudget = parseWhatsAppMessage('budget');
assert(qBudget.type === 'budget_status', 'Should parse budget_status');

const setBudget = parseWhatsAppMessage('set budget 4.5jt');
assert(setBudget.type === 'set_budget', 'Should parse set_budget');
assert(setBudget.budgetAmount === 4500000, 'Should parse 4.5jt as 4500000');

console.log('✓ parseWhatsAppMessage tests passed');

// 3. Test calculateDailyEstimate
// Budget 3.000.000, spent 1.000.000, 10 days left -> 2.000.000 / 10 = 200.000/day
const today = new Date('2026-10-22T00:00:00');
const periodEnd = new Date('2026-10-31T23:59:59');
const est = calculateDailyEstimate(3000000, 1000000, periodEnd, today);
assert(est.remainingBudget === 2000000, 'Remaining budget should be 2000000');
assert(est.remainingDays === 10, 'Remaining days should be 10');
assert(est.dailyEstimate === 200000, 'Daily estimate should be 200000');

// Overbudget test: spent > budget
const overEst = calculateDailyEstimate(1000000, 1200000, periodEnd, today);
assert(overEst.remainingBudget === 0, 'Remaining budget should be 0 when over');
assert(overEst.dailyEstimate === 0, 'Daily estimate should be 0 when over');

console.log('✓ calculateDailyEstimate tests passed');

// 4. Test computeBudgetSummary
const summary = computeBudgetSummary({
  monthlyBudget: 3000000,
  totalSpent: 900000,
  todaySpent: 50000,
  budgetStartDay: 1,
  referenceDate: new Date('2026-10-15T00:00:00'),
});
assert(summary.percentSpent === 30, 'percentSpent should be 30%');
assert(summary.isOverBudget === false, 'isOverBudget should be false');
assert(summary.todaySpent === 50000, 'todaySpent should be 50000');

console.log('✓ computeBudgetSummary tests passed');
console.log('\nAll unit tests completed successfully!');
