import { st } from "../styles/shared";
import { theme } from "../styles/theme";
import { fm, fp } from "../calc/format";
import { monthsToFire, yearsToFireLabel } from "../calc/fire";
import { EditableField } from "../components/shared/EditableField";
import { FsStat } from "../components/shared/FsStat";
import { FRow } from "../components/shared/FRow";
import type { AppState, FireParams } from "../types/models";
import type { AppContext } from "../types/context";
import type { SaveFn } from "../hooks/useAppData";

interface FireTabProps {
  data: AppState;
  save: SaveFn;
  cx: AppContext;
}

interface FireField {
  k: keyof FireParams;
  l: string;
}

const FIELDS: FireField[] = [
  { k: "salary", l: "Salario neto" },
  { k: "invest", l: "Inversión mensual" },
  { k: "portfolio", l: "Cartera actual" },
  { k: "target", l: "Objetivo pasivo mensual" },
  { k: "returnRate", l: "Rentabilidad anual %" },
  { k: "swr", l: "Tasa retiro segura %" },
  { k: "appreciation", l: "Revalorización inmuebles %" },
];

export function FireTab({ data, save, cx }: FireTabProps) {
  const months = monthsToFire(data.fire, cx.fireNum);
  const yToFire = yearsToFireLabel(months);
  const resPct = data.reserveGoal > 0 ? Math.min((data.reserve / data.reserveGoal) * 100, 100) : 0;

  function commitFire(changes: Partial<FireParams>) {
    save((d) => ({ ...d, fire: { ...d.fire, ...changes } }));
  }

  return (
    <div style={st.col}>
      <div style={{ ...st.card, textAlign: "center", padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 10 }}>🔥 Progreso FIRE</div>
        <svg viewBox="0 0 200 120" style={{ width: "100%", maxWidth: 240 }}>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1f2937" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#fg2)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(cx.firePct, 1) * 251.2} 251.2`}
          />
          <defs>
            <linearGradient id="fg2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.danger} />
              <stop offset="50%" stopColor={theme.warning} />
              <stop offset="100%" stopColor={theme.success} />
            </linearGradient>
          </defs>
          <text x="100" y="80" textAnchor="middle" fill={theme.textPrimary} fontSize="24" fontWeight="700" fontFamily="monospace">
            {(cx.firePct * 100).toFixed(1)}%
          </text>
          <text x="100" y="100" textAnchor="middle" fill={theme.textFaint} fontSize="10">
            Meta: {fm(cx.fireNum)}
          </text>
        </svg>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
          <FsStat v={yToFire} l="años FIRE" />
          <FsStat v={fp(cx.savRate)} l="tasa ahorro" />
          <FsStat v={fm(cx.rentalFCL)} l="FCL inmuebles" c={cx.rentalFCL >= 0 ? theme.success : theme.danger} />
          <FsStat v={fm(cx.disposable)} l="disponible" c={cx.disposable >= 0 ? theme.success : theme.danger} />
        </div>
      </div>

      <div style={{ ...st.card, background: theme.bgInfo, border: `1px solid ${theme.borderInfo}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.info, marginBottom: 6 }}>💳 Flujo integrado mensual</div>
        <FRow l="Ingresos personales" v={cx.bInc} c={theme.success} />
        <FRow l="Rentas netas" v={cx.rentalFCL} c={cx.rentalFCL >= 0 ? "#34d399" : theme.danger} />
        <div style={{ borderTop: `1px solid ${theme.borderInfo}`, margin: "4px 0" }} />
        <FRow l="Total ingreso" v={cx.bInc + cx.rentalFCL} c={theme.success} bold />
        <FRow l="Gastos personales" v={-cx.bExp} c={theme.danger} />
        <FRow l="Inversión" v={-data.fire.invest} c={theme.accentBlue} />
        <div style={{ borderTop: `2px solid ${theme.borderInfo}`, margin: "4px 0" }} />
        <FRow
          l="Sobrante libre"
          v={cx.disposable - data.fire.invest}
          c={cx.disposable - data.fire.invest >= 0 ? theme.success : theme.danger}
          bold
        />
      </div>

      <div style={st.card}>
        <div style={st.secT}>Fondo de reserva</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ flex: 1, height: 16, background: theme.border, borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                width: resPct + "%",
                height: "100%",
                borderRadius: 4,
                background: resPct >= 80 ? "#22c55e" : resPct >= 40 ? "#eab308" : "#ef4444",
              }}
            />
          </div>
          <EditableField
            value={data.reserve}
            onCommit={(v) => save((d) => ({ ...d, reserve: v }))}
            format={(v) => fm(v)}
            width={80}
            color={theme.textPrimary}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: theme.textFaint, marginBottom: 6 }}>
          <span>0€</span>
          <span>Meta: {fm(data.reserveGoal)}</span>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[100, 200, 500].map((n) => (
            <button key={n} onClick={() => save((d) => ({ ...d, reserve: d.reserve + n }))} style={st.smBtn}>
              +{n}€
            </button>
          ))}
        </div>
      </div>

      <div style={st.card}>
        <div style={st.secT}>Parámetros FIRE</div>
        {FIELDS.map((f) => (
          <div key={f.k} style={st.editRow}>
            <span style={{ color: theme.textMuted, fontSize: 12, flex: 1 }}>{f.l}</span>
            <EditableField
              value={data.fire[f.k]}
              onCommit={(v) => commitFire({ [f.k]: v } as Partial<FireParams>)}
              format={(v) => v.toLocaleString("es-ES")}
              width={75}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
