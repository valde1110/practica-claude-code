import { useState } from "react";
import { st } from "../styles/shared";
import { theme } from "../styles/theme";
import { fm } from "../calc/format";
import { EditableField } from "../components/shared/EditableField";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { DRow } from "../components/shared/DRow";
import { AlertBox } from "../components/shared/AlertBox";
import type { Property, YearMode, AlertLevel } from "../types/models";
import type { PropertyCalc } from "../calc/property";
import type { SaveFn } from "../hooks/useAppData";

interface PropertyDetailTabProps {
  property: Property;
  calc: PropertyCalc;
  yearMode: YearMode;
  save: SaveFn;
  onRemove: () => void;
}

interface NumField {
  k: keyof Property;
  l: string;
  u: string;
  miss?: boolean;
  onCommitExtra?: Partial<Property>;
}

export function PropertyDetailTab({ property: p, calc: c, yearMode, save, onRemove }: PropertyDetailTabProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("info");

  function up(changes: Partial<Property>) {
    save((d) => ({ ...d, props: d.props.map((pr) => (pr.id === p.id ? { ...pr, ...changes } : pr)) }));
  }

  const fields: NumField[] = [
    { k: "rent", l: "Renta mensual", u: "€/mes" },
    { k: "vacancy", l: "Vacancia estimada", u: "%" },
    { k: "mortM1", l: "Cuota hipoteca año 1", u: "€/mes" },
    { k: "mortM2", l: "Cuota hipoteca año 2+", u: "€/mes" },
    { k: "rateY1", l: "Tipo interés año 1", u: "%" },
    { k: "rateY2", l: "Tipo interés año 2+", u: "%" },
    { k: "mortTerm", l: "Plazo hipoteca", u: "años" },
    { k: "insAnnual", l: "Seguro anual", u: "€/año" },
    { k: "ibi", l: "IBI anual", u: "€/año", miss: !p.ibiSet, onCommitExtra: { ibiSet: true } },
    { k: "community", l: "Comunidad", u: "€/mes", miss: !p.commSet, onCommitExtra: { commSet: true } },
    { k: "maint", l: "Provisión mantenimiento", u: "€/mes" },
    { k: "price", l: "Valor de compra", u: "€" },
    { k: "depBase", l: "Base amortización", u: "€" },
    { k: "depRate", l: "Amortización anual", u: "%" },
  ];

  function addAlert() {
    if (!alertText.trim()) return;
    up({ alerts: [...p.alerts, { t: alertLevel, txt: alertText.trim() }] });
    setAlertText("");
  }

  function removeAlert(idx: number) {
    up({ alerts: p.alerts.filter((_, i) => i !== idx) });
  }

  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: theme.textPrimary }}>
            {p.icon} {p.name}
          </div>
          <button
            onClick={() => up({ active: !p.active })}
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 8,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: p.active ? theme.successBg : theme.warningBg,
              color: p.active ? theme.successText : theme.warningText,
            }}
          >
            {p.active ? "Activo" : "Pendiente"}
          </button>
        </div>
        {p.mortM1 > 0 && (
          <div style={{ background: theme.bgSubtle, borderRadius: 8, padding: 10, border: `1px solid ${theme.borderSubtle}`, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: theme.textMuted, fontSize: 12 }}>Hipoteca {p.bank || "—"}</span>
              <span style={{ color: theme.textPrimary, fontWeight: 600, fontSize: 13 }}>{fm(-c.mort)}/mes</span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 5, fontSize: 11, color: theme.textFaint }}>
              <span>Tipo: {yearMode === 1 ? p.rateY1 : p.rateY2}%</span>
              <span>Plazo: {p.mortTerm}a</span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            placeholder="Banco (opcional)"
            value={p.bank}
            onChange={(e) => up({ bank: e.target.value })}
            style={st.inp}
          />
          <input
            placeholder="Aseguradora / póliza (opcional)"
            value={p.insLabel}
            onChange={(e) => up({ insLabel: e.target.value })}
            style={st.inp}
          />
        </div>
      </div>

      <div style={st.card}>
        <div style={st.secT}>Parámetros</div>
        {fields.map((f) => (
          <div key={f.k} style={{ ...st.editRow, ...(f.miss ? { borderLeft: "3px solid #fbbf24" } : {}) }}>
            <span style={{ color: theme.textMuted, fontSize: 12, flex: 1 }}>
              {f.l}
              {f.miss && <span style={{ color: theme.warning, fontSize: 10, marginLeft: 4 }}>⚠</span>}
            </span>
            <EditableField
              value={p[f.k] as number}
              onCommit={(v) => up({ [f.k]: v, ...f.onCommitExtra } as Partial<Property>)}
              format={(v) => `${v} ${f.u}`}
              width={70}
            />
          </div>
        ))}
      </div>

      <div style={st.card}>
        <div style={st.secT}>Desglose mensual</div>
        <DRow l="Renta" v={c.income} green />
        <DRow l="Hipoteca" v={-c.mort} />
        <DRow l="Seguro" v={-c.ins} sub={p.insLabel || undefined} />
        <DRow l="IBI" v={-c.ibi} miss={!p.ibiSet} />
        <DRow l="Comunidad" v={-c.comm} miss={!p.commSet} />
        <DRow l="Mantenimiento" v={-c.mnt} />
        <DRow l="Vacancia" v={-c.vac} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #374151", marginTop: 6 }}>
          <span style={{ fontWeight: 700 }}>FCL</span>
          <span style={{ fontWeight: 700, fontSize: 17, color: c.fcl >= 0 ? theme.success : theme.danger, fontFamily: theme.fontMono }}>
            {fm(c.fcl)}
          </span>
        </div>
        {c.dep > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              opacity: 0.5,
              fontSize: 11,
              paddingTop: 4,
              borderTop: "1px dashed #374151",
            }}
          >
            <span>Deducción amortización</span>
            <span style={{ color: theme.info }}>{fm(c.dep)}/mes fiscal</span>
          </div>
        )}
      </div>

      <div style={st.card}>
        <div style={st.secT}>Alertas</div>
        {p.alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
            <div style={{ flex: 1 }}>
              <AlertBox a={{ ...a, prop: p.name }} />
            </div>
            <button onClick={() => removeAlert(i)} style={{ background: "none", border: "none", color: theme.textDim, cursor: "pointer", fontSize: 13, marginTop: 6 }}>
              🗑
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
          <select value={alertLevel} onChange={(e) => setAlertLevel(e.target.value as AlertLevel)} style={st.inp}>
            <option value="info">Info</option>
            <option value="warn">Aviso</option>
            <option value="crit">Crítico</option>
          </select>
          <input
            placeholder="Texto de la alerta"
            value={alertText}
            onChange={(e) => setAlertText(e.target.value)}
            style={{ ...st.inp, flex: 1 }}
          />
          <button onClick={addAlert} style={{ ...st.addBtn, background: "#166534" }}>
            +
          </button>
        </div>
      </div>

      <button
        onClick={() => setConfirmRemove(true)}
        style={{ ...st.smBtn, background: theme.dangerBg, color: theme.dangerText, alignSelf: "flex-start" }}
      >
        🗑 Eliminar inmueble
      </button>

      <ConfirmDialog
        open={confirmRemove}
        title={`¿Eliminar "${p.name}"?`}
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          setConfirmRemove(false);
          onRemove();
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
