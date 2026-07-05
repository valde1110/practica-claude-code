import { st } from "../../styles/shared";
import { theme } from "../../styles/theme";

interface KpiProps {
  l: string;
  v: string;
  s: string;
  ok: boolean;
}

export function Kpi({ l, v, s, ok }: KpiProps) {
  return (
    <div style={st.kpiCard}>
      <span style={{ fontSize: 10, color: theme.textFaint, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {l}
      </span>
      <span style={{ fontSize: 17, fontWeight: 700, fontFamily: theme.fontMono, color: ok ? theme.success : theme.danger }}>
        {v}
      </span>
      <span style={{ fontSize: 10, color: theme.textDim }}>{s}</span>
    </div>
  );
}
