import { useState } from "react";
import { st } from "../styles/shared";
import { theme } from "../styles/theme";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import type { AppState } from "../types/models";
import type { SaveFn } from "../hooks/useAppData";

interface SettingsTabProps {
  data: AppState;
  save: SaveFn;
  resetToBlank: () => void;
  loadSampleData: () => void;
}

export function SettingsTab({ data, save, resetToBlank, loadSampleData }: SettingsTabProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={st.secT}>Modo hipoteca</div>
        <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 8 }}>
          Año 1 usa la cuota/tipo inicial de cada inmueble; Año 2+ usa la cuota/tipo posterior.
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => save((d) => ({ ...d, yearMode: n as 1 | 2 }))}
              style={{ ...st.smBtn, ...(data.yearMode === n ? { background: theme.borderInfo, color: theme.info } : {}) }}
            >
              Año {n}
            </button>
          ))}
        </div>
      </div>

      <div style={st.card}>
        <div style={st.secT}>Datos</div>
        <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 8 }}>
          Guardados en este dispositivo (localStorage). No se sincronizan con otros dispositivos.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={loadSampleData} style={st.smBtn}>
            Cargar datos de ejemplo
          </button>
          <button onClick={() => setConfirmReset(true)} style={{ ...st.smBtn, background: theme.dangerBg, color: theme.dangerText }}>
            Resetear todo
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="¿Resetear todo?"
        message="Se borrarán todos los inmuebles, ingresos, gastos y parámetros FIRE guardados."
        confirmLabel="Resetear"
        danger
        onConfirm={() => {
          setConfirmReset(false);
          resetToBlank();
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
