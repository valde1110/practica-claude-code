export interface ParsedExpenseLine {
  label: string;
  amt: number;
}

const AMOUNT_RE = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*€?/;
const SKIP_WORDS = /total|euros|importe|concepto|pago por|tipo de gasto/i;

function toNumber(raw: string): number {
  // "1.234,56" (EU) or "996,35" or "996.35" -> 1234.56 / 996.35
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let normalized = raw;
  if (hasComma && hasDot) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = raw.replace(",", ".");
  }
  return parseFloat(normalized) || 0;
}

export function parseExpenseLines(rawText: string): ParsedExpenseLine[] {
  const lines = rawText.split("\n");
  const results: ParsedExpenseLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (SKIP_WORDS.test(trimmed)) continue;

    const match = AMOUNT_RE.exec(trimmed);
    if (!match || match.index === undefined) continue;

    const label = trimmed
      .slice(0, match.index)
      .replace(/[|:\-–]+$/, "")
      .trim();
    const amt = toNumber(match[1]);

    if (!label || amt <= 0) continue;
    results.push({ label, amt });
  }

  return results;
}
