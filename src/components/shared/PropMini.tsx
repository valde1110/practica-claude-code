import { fm } from "../../calc/format";
import { theme } from "../../styles/theme";
import { st } from "../../styles/shared";
import type { PropertyCalc } from "../../calc/property";

interface PropMiniProps {
  name: string;
  active: boolean;
  c: PropertyCalc;
  ic: string;
}

export function PropMini({ name, active, c, ic }: PropMiniProps) {
  const bw = c.income > 0 ? Math.min((c.exp / c.income) * 100, 100) : 0;
  return (
    <div style={st.propC}>
      <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{ic}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>{name}</div>
          <span
            style={{
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: 6,
              fontWeight: 600,
              background: active ? theme.successBg : theme.warningBg,
              color: active ? theme.successText : theme.warningText,
            }}
          >
            {active ? "Activo" : "Pend."}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: theme.textMuted }}>Ingreso</span>
        <span style={{ color: theme.success }}>{fm(c.income)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: theme.textMuted }}>Gastos</span>
        <span style={{ color: theme.danger }}>{fm(-c.exp)}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: `1px solid ${theme.borderSubtle}`,
          paddingTop: 5,
          marginTop: 5,
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: 11 }}>FCL</span>
        <span style={{ fontSize: 15, color: c.fcl >= 0 ? theme.success : theme.danger, fontFamily: theme.fontMono }}>
          {fm(c.fcl)}
        </span>
      </div>
      <div style={{ height: 3, background: theme.border, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
        <div
          style={{
            width: bw + "%",
            height: "100%",
            borderRadius: 2,
            background: bw > 95 ? theme.danger : bw > 80 ? theme.warning : theme.success,
          }}
        />
      </div>
    </div>
  );
}
