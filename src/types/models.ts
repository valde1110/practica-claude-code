export type AlertLevel = "crit" | "warn" | "info";

export interface Alert {
  t: AlertLevel;
  txt: string;
}

export interface Property {
  id: string;
  name: string;
  icon: string;
  active: boolean;

  rent: number;
  mortM1: number;
  mortM2: number;
  rateY1: number;
  rateY2: number;
  mortTerm: number;
  bank: string;

  insAnnual: number;
  insLabel: string;

  ibi: number;
  community: number;
  maint: number;
  vacancy: number;

  depBase: number;
  depRate: number;
  price: number;

  ibiSet: boolean;
  commSet: boolean;

  alerts: Alert[];
}

export interface FireParams {
  salary: number;
  invest: number;
  portfolio: number;
  target: number;
  returnRate: number;
  swr: number;
  appreciation: number;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface BudgetItem {
  id: string;
  cat: string;
  label: string;
  amt: number;
}

export type YearMode = 1 | 2;

export interface AppState {
  props: Property[];
  fire: FireParams;
  incomes: BudgetItem[];
  expenses: BudgetItem[];
  reserve: number;
  reserveGoal: number;
  yearMode: YearMode;
  projYears: number;
}

export const SCHEMA_VERSION = 1;

export interface PersistedEnvelope {
  schemaVersion: number;
  state: AppState;
}
