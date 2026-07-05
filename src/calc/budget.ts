import type { BudgetItem, Category } from "../types/models";

export function sumAmt(items: BudgetItem[]): number {
  return items.reduce((s, i) => s + i.amt, 0);
}

export interface CategoryBreakdown extends Category {
  sum: number;
  pct: number;
}

export function byCategory(items: BudgetItem[], cats: Category[]): CategoryBreakdown[] {
  const total = sumAmt(items);
  return cats
    .map((c) => {
      const sum = items.filter((i) => i.cat === c.id).reduce((s, i) => s + i.amt, 0);
      return { ...c, sum, pct: total > 0 ? sum / total : 0 };
    })
    .filter((c) => c.sum > 0)
    .sort((a, b) => b.sum - a.sum);
}
