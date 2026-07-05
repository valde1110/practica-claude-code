import { uid } from "../calc/format";
import type { AppState, Property } from "../types/models";

export function newProperty(name: string, icon = "🏠"): Property {
  return {
    id: uid(),
    name,
    icon,
    active: true,
    rent: 0,
    mortM1: 0,
    mortM2: 0,
    rateY1: 0,
    rateY2: 0,
    mortTerm: 0,
    bank: "",
    insAnnual: 0,
    insLabel: "",
    ibi: 0,
    community: 0,
    maint: 0,
    vacancy: 0,
    depBase: 0,
    depRate: 0,
    price: 0,
    ibiSet: true,
    commSet: true,
    alerts: [],
  };
}

export function createEmptyState(): AppState {
  return {
    props: [],
    fire: {
      salary: 0,
      invest: 0,
      portfolio: 0,
      target: 0,
      returnRate: 7,
      swr: 4,
      appreciation: 2,
    },
    incomes: [],
    expenses: [],
    reserve: 0,
    reserveGoal: 0,
    yearMode: 1,
    projYears: 15,
  };
}

export function createSampleState(): AppState {
  const piso = newProperty("Piso de ejemplo", "🏠");
  piso.active = true;
  piso.rent = 800;
  piso.mortM1 = 500;
  piso.mortM2 = 520;
  piso.rateY1 = 2;
  piso.rateY2 = 3;
  piso.mortTerm = 25;
  piso.bank = "Banco de ejemplo";
  piso.insAnnual = 250;
  piso.insLabel = "Seguro hogar";
  piso.ibi = 300;
  piso.community = 40;
  piso.maint = 50;
  piso.vacancy = 5;
  piso.depBase = 120000;
  piso.depRate = 3;
  piso.price = 150000;
  piso.alerts = [{ t: "info", txt: "Este inmueble es un ejemplo — edítalo o bórralo cuando quieras." }];

  return {
    props: [piso],
    fire: {
      salary: 2000,
      invest: 400,
      portfolio: 5000,
      target: 1500,
      returnRate: 7,
      swr: 4,
      appreciation: 2,
    },
    incomes: [{ id: uid(), cat: "salary", label: "Nómina (ejemplo)", amt: 2000 }],
    expenses: [
      { id: uid(), cat: "food", label: "Supermercado (ejemplo)", amt: 300 },
      { id: uid(), cat: "transport", label: "Transporte (ejemplo)", amt: 100 },
      { id: uid(), cat: "leisure", label: "Ocio (ejemplo)", amt: 150 },
    ],
    reserve: 1000,
    reserveGoal: 6000,
    yearMode: 1,
    projYears: 15,
  };
}
