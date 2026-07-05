import type { AppState, Property } from "../types/models";
import { fireNumber } from "./fire";

export interface ProjectionRow {
  year: number;
  rFCL: number;
  annC: number;
  portfolio: number;
  invInc: number;
  nw: number;
  fp: number;
}

function activeMonths(p: Property, y: number): number {
  if (p.active) return y === 0 ? 11 : 12;
  return y === 0 ? 0 : 12;
}

function propertyYearFCL(p: Property, y: number): number {
  const months = activeMonths(p, y);
  const mort = (y === 0 ? p.mortM1 : p.mortM2) * months;
  const rentIncome = p.rent * months;
  const vac = ((p.rent * p.vacancy) / 100) * months;
  const community = p.community * months;
  const maint = p.maint * months;
  return rentIncome - mort - p.insAnnual - p.ibi - community - maint - vac;
}

export function computeProjection(
  state: AppState,
  years: number,
  startYear: number = new Date().getFullYear()
): { rows: ProjectionRow[]; fireYear: ProjectionRow | undefined } {
  const fr = state.fire;
  const ar = fr.returnRate / 100;
  const annC = fr.invest * 12;
  const swr = fr.swr / 100;
  const appr = (fr.appreciation || 0) / 100;
  const fireNum = fireNumber(fr);

  let portfolio = fr.portfolio;
  const propValues = state.props.map((p) => p.price || 0);

  const rows: ProjectionRow[] = [];
  for (let y = 0; y <= years; y++) {
    const year = startYear + y;
    const rFCL = state.props.reduce((sum, p) => sum + propertyYearFCL(p, y), 0);

    if (y > 0) {
      portfolio = portfolio * (1 + ar) + annC;
      for (let i = 0; i < propValues.length; i++) {
        if (propValues[i] > 0) propValues[i] *= 1 + appr;
      }
    }

    const invInc = portfolio * swr;
    const nw = portfolio + propValues.reduce((s, v) => s + v, 0);
    rows.push({
      year,
      rFCL,
      annC,
      portfolio,
      invInc,
      nw,
      fp: fireNum > 0 ? portfolio / fireNum : 0,
    });
  }

  return { rows, fireYear: rows.find((r) => r.fp >= 1) };
}
