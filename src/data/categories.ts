import type { Category } from "../types/models";

export const EXP_CATS: Category[] = [
  { id: "food", label: "Alimentación", icon: "🛒", color: "#fb923c" },
  { id: "transport", label: "Transporte", icon: "🚗", color: "#fbbf24" },
  { id: "utilities", label: "Suministros", icon: "💡", color: "#a78bfa" },
  { id: "leisure", label: "Ocio", icon: "🎬", color: "#34d399" },
  { id: "health", label: "Salud", icon: "🏥", color: "#f472b6" },
  { id: "subs", label: "Suscripciones", icon: "📱", color: "#c084fc" },
  { id: "insurance", label: "Seguros", icon: "🛡", color: "#60a5fa" },
  { id: "other", label: "Otros", icon: "📦", color: "#94a3b8" },
];

export const INC_CATS: Category[] = [
  { id: "salary", label: "Nómina", icon: "💼", color: "#4ade80" },
  { id: "rental", label: "Alquileres", icon: "🏘", color: "#34d399" },
  { id: "freelance", label: "Freelance", icon: "💻", color: "#a78bfa" },
  { id: "other_inc", label: "Otros", icon: "💰", color: "#fbbf24" },
];

export const PROPERTY_ICONS = ["🏠", "🏖", "🏢", "🏡", "🏚", "🏭", "🏗", "🗝"];
