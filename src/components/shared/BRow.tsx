import { EditableField } from "./EditableField";
import { theme } from "../../styles/theme";
import type { BudgetItem, Category } from "../../types/models";

interface BRowProps {
  item: BudgetItem;
  cats: Category[];
  type: "inc" | "exp";
  onRm: () => void;
  onAmt: (amt: number) => void;
}

export function BRow({ item, cats, type, onRm, onAmt }: BRowProps) {
  const cat = cats.find((c) => c.id === item.cat);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: "1px solid #1f2937" }}>
      <span style={{ fontSize: 15 }}>{cat ? cat.icon : "📦"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: theme.textSecondary }}>{item.label}</div>
        <div style={{ fontSize: 10, color: theme.textFaint }}>{cat ? cat.label : ""}</div>
      </div>
      <EditableField
        value={item.amt}
        onCommit={onAmt}
        width={65}
        color={type === "inc" ? theme.success : theme.danger}
        format={(v) => `${type === "inc" ? "+" : "−"}${v}€`}
      />
      <button onClick={onRm} style={{ background: "none", border: "none", color: theme.textDim, cursor: "pointer", fontSize: 13 }}>
        🗑
      </button>
    </div>
  );
}
