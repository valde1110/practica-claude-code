import { st } from "../../styles/shared";

export type TabId = "dash" | "budget" | "props" | "fire" | "yearly" | "set";

const TABS: { id: TabId; lbl: string; ic: string }[] = [
  { id: "dash", lbl: "Panel", ic: "◉" },
  { id: "budget", lbl: "Gastos", ic: "💳" },
  { id: "props", lbl: "Inmuebles", ic: "🏠" },
  { id: "fire", lbl: "FIRE", ic: "🔥" },
  { id: "yearly", lbl: "Proyección", ic: "📊" },
  { id: "set", lbl: "Ajustes", ic: "⚙" },
];

interface TabNavProps {
  tab: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNav({ tab, onChange }: TabNavProps) {
  return (
    <nav style={st.nav}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{ ...st.navBtn, ...(tab === t.id ? st.navAct : {}) }}
        >
          <span style={{ fontSize: 15 }}>{t.ic}</span>
          <span style={{ fontSize: 9 }}>{t.lbl}</span>
        </button>
      ))}
    </nav>
  );
}
