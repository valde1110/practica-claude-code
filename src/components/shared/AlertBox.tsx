import { theme } from "../../styles/theme";
import type { Alert } from "../../types/models";

interface AlertBoxProps {
  a: Alert & { prop: string };
}

export function AlertBox({ a }: AlertBoxProps) {
  const bg = a.t === "crit" ? "#1c0f0f" : a.t === "warn" ? "#1c1a0f" : theme.bgInfo;
  const bd = a.t === "crit" ? theme.dangerBg : a.t === "warn" ? theme.warningBg : theme.borderInfo;
  const dot = a.t === "crit" ? "🔴" : a.t === "warn" ? "🟡" : "🔵";
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "flex-start",
        padding: "7px 8px",
        borderRadius: 8,
        background: bg,
        border: `1px solid ${bd}`,
        fontSize: 11,
        marginTop: 4,
      }}
    >
      <span>{dot}</span>
      <div>
        <span
          style={{
            fontSize: 9,
            color: theme.textMuted,
            display: "block",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {a.prop}
        </span>
        <span style={{ color: theme.textSecondary, lineHeight: 1.4 }}>{a.txt}</span>
      </div>
    </div>
  );
}
