export function fm(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  const s = Math.abs(Math.round(n)).toLocaleString("es-ES");
  if (n < -0.5) return "−" + s + "€";
  if (n > 0.5) return "+" + s + "€";
  return "0€";
}

export function fk(n: number): string {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M€";
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + "k€";
  return fm(n);
}

export function fp(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
