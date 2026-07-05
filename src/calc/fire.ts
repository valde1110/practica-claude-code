import type { FireParams } from "../types/models";

export function fireNumber(fire: FireParams): number {
  return fire.swr > 0 ? (fire.target * 12) / (fire.swr / 100) : 0;
}

export function firePct(fire: FireParams, target: number): number {
  return target > 0 ? fire.portfolio / target : 0;
}

const MAX_MONTHS = 720;

export function monthsToFire(fire: FireParams, target: number): number {
  const mr = fire.returnRate / 100 / 12;
  let port = fire.portfolio;
  let mo = 0;
  while (port < target && mo < MAX_MONTHS) {
    port = port * (1 + mr) + fire.invest;
    mo++;
  }
  return mo;
}

export function yearsToFireLabel(months: number): string {
  return months < MAX_MONTHS ? (months / 12).toFixed(1) : "60+";
}

export function savingsRate(fire: FireParams, personalIncome: number, rentalFCL: number): number {
  const base = personalIncome + Math.max(rentalFCL, 0);
  return base > 0 ? fire.invest / base : 0;
}
