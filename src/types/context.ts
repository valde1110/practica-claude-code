import type { PropertyCalc } from "../calc/property";

export interface AppContext {
  propCalcs: PropertyCalc[];
  rentalFCL: number;
  bInc: number;
  bExp: number;
  bNet: number;
  disposable: number;
  fireNum: number;
  firePct: number;
  savRate: number;
}
