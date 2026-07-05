import type { CSSProperties } from "react";
import { st } from "../styles/shared";
import { theme } from "../styles/theme";
import { fk } from "../calc/format";
import { computeProjection } from "../calc/projection";
import type { AppState } from "../types/models";
import type { SaveFn } from "../hooks/useAppData";

interface YearlyTabProps {
  data: AppState;
  save: SaveFn;
}

const tdc: CSSProperties = { padding: "6px", textAlign: "right", fontFamily: theme.fontMono, color: theme.textSecondary, whiteSpace: "nowrap" };

export function YearlyTab({ data, save }: YearlyTabProps) {
  const yrs = data.projYears || 15;
  const { rows, fireYear } = computeProjection(data, yrs);
  const mx = Math.max(...rows.map((r) => r.nw), 1);

  return (
    <div style={st.col}>
      <div
        style={{
          ...st.card,
          textAlign: "center",
          background: fireYear ? "#0a1f0a" : "#1a0f0f",
          border: `1px solid ${fireYear ? "#166534" : "#7f1d1d"}`,
        }}
      >
        {fireYear ? (
          <div>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div style={{ color: theme.success, margin: "6px 0 3px", fontSize: 15, fontWeight: 600 }}>FIRE en {fireYear.year}</div>
            <div style={{ fontSize: 12, color: theme.textFaint }}>
              Patrimonio: {fk(fireYear.nw)} · Cartera: {fk(fireYear.portfolio)}
            </div>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: 28 }}>🔥</span>
            <div style={{ color: theme.warning, margin: "6px 0 3px", fontSize: 15, fontWeight: 600 }}>FIRE no alcanzado en {yrs} años</div>
            <div style={{ fontSize: 12, color: theme.textFaint }}>Aumenta inversión o ingresos pasivos</div>
          </div>
        )}
      </div>

      <div style={st.card}>
        <div style={st.secT}>Evolución patrimonio</div>
        {rows
          .filter((_, i) => i % (yrs > 12 ? 2 : 1) === 0 || i === rows.length - 1)
          .map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span
                style={{
                  width: 32,
                  fontSize: 10,
                  color: r.fp >= 1 ? theme.success : theme.textFaint,
                  textAlign: "right",
                  fontWeight: r.fp >= 1 ? 700 : 400,
                }}
              >
                {r.year}
              </span>
              <div style={{ flex: 1, height: 18, background: theme.bgSubtle, borderRadius: 4, display: "flex", overflow: "hidden" }}>
                <div style={{ width: (r.portfolio / mx) * 100 + "%", height: "100%", background: theme.accentIndigo }} />
                <div style={{ width: ((r.nw - r.portfolio) / mx) * 100 + "%", height: "100%", background: theme.accentTeal }} />
              </div>
              <span style={{ fontSize: 10, color: theme.textMuted, minWidth: 44, textAlign: "right", fontFamily: theme.fontMono }}>
                {fk(r.nw)}
              </span>
            </div>
          ))}
        <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
          <span style={{ fontSize: 10, color: theme.textFaint }}>
            <span style={{ display: "inline-block", width: 8, height: 8, background: theme.accentIndigo, borderRadius: 2, marginRight: 3, verticalAlign: "middle" }} />
            Cartera
          </span>
          <span style={{ fontSize: 10, color: theme.textFaint }}>
            <span style={{ display: "inline-block", width: 8, height: 8, background: theme.accentTeal, borderRadius: 2, marginRight: 3, verticalAlign: "middle" }} />
            Inmuebles
          </span>
        </div>
      </div>

      <div style={{ ...st.card, overflowX: "auto" }}>
        <div style={st.secT}>Tabla proyección</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #374151" }}>
              {["Año", "Renta FCL", "Inversión", "Cartera", "Rta. inv.", "Patrimonio", "FIRE"].map((h) => (
                <th key={h} style={{ padding: "5px 6px", textAlign: "right", color: theme.textFaint, fontWeight: 600, fontSize: 10 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1f2937", ...(r.fp >= 1 ? { background: "#0a1f0a" } : {}) }}>
                <td style={tdc}>{r.year}</td>
                <td style={{ ...tdc, color: r.rFCL >= 0 ? theme.success : theme.danger }}>{fk(r.rFCL)}</td>
                <td style={tdc}>{fk(r.annC)}</td>
                <td style={{ ...tdc, color: theme.accentBlue }}>{fk(r.portfolio)}</td>
                <td style={{ ...tdc, color: theme.info }}>{fk(r.invInc)}</td>
                <td style={{ ...tdc, fontWeight: 600, color: theme.textPrimary }}>{fk(r.nw)}</td>
                <td style={tdc}>
                  <span
                    style={{
                      padding: "2px 5px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      background: r.fp >= 1 ? "#166534" : r.fp >= 0.5 ? "#78350f" : "#1f2937",
                      color: r.fp >= 1 ? "#86efac" : r.fp >= 0.5 ? theme.warningText : theme.textFaint,
                    }}
                  >
                    {Math.round(r.fp * 100)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={st.card}>
        <div style={st.secT}>Años de proyección</div>
        <div style={{ display: "flex", gap: 5 }}>
          {[10, 15, 20, 25, 30].map((n) => (
            <button
              key={n}
              onClick={() => save((d) => ({ ...d, projYears: n }))}
              style={{ ...st.smBtn, ...(yrs === n ? { background: theme.borderInfo, color: theme.info } : {}) }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
