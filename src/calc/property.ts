import type { Property } from "../types/models";

export interface PropertyCalc {
  income: number;
  mort: number;
  ins: number;
  ibi: number;
  comm: number;
  mnt: number;
  vac: number;
  exp: number;
  fcl: number;
  dep: number;
}

export function propCalc(p: Property, y2: boolean): PropertyCalc {
  const mort = y2 ? p.mortM2 : p.mortM1;
  const ins = p.insAnnual / 12;
  const ibi = p.ibi / 12;
  const comm = p.community;
  const mnt = p.maint;
  const vac = (p.rent * p.vacancy) / 100;
  const dep = (p.depBase * p.depRate) / 100 / 12;
  const exp = mort + ins + ibi + comm + mnt + vac;
  const fcl = p.rent - exp;
  return { income: p.rent, mort, ins, ibi, comm, mnt, vac, exp, fcl, dep };
}
