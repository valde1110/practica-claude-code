import { st } from "../../styles/shared";
import { theme } from "../../styles/theme";
import type { YearMode } from "../../types/models";

interface HeaderProps {
  yearMode: YearMode;
  onToggleYear: () => void;
}

export function Header({ yearMode, onToggleYear }: HeaderProps) {
  return (
    <header style={st.hdr}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 22, color: theme.success }}>◉</span>
        <div>
          <div style={st.title}>FIRE Portfolio</div>
          <div style={st.sub}>Inmuebles · Presupuesto · FIRE</div>
        </div>
      </div>
      <span style={st.yrBadge} onClick={onToggleYear}>
        Año {yearMode}
      </span>
    </header>
  );
}
