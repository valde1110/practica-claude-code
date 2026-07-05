import { useState } from "react";
import { st } from "../styles/shared";
import { theme } from "../styles/theme";
import { newProperty } from "../data/defaults";
import { PROPERTY_ICONS } from "../data/categories";
import { propCalc } from "../calc/property";
import { PropertyDetailTab } from "./PropertyDetailTab";
import type { AppState, YearMode } from "../types/models";
import type { SaveFn } from "../hooks/useAppData";

interface PropertiesTabProps {
  data: AppState;
  save: SaveFn;
  yearMode: YearMode;
}

export function PropertiesTab({ data, save, yearMode }: PropertiesTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(data.props[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(PROPERTY_ICONS[0]);

  const selected = data.props.find((p) => p.id === selectedId) ?? data.props[0] ?? null;

  function addProperty() {
    if (!name.trim()) return;
    const p = newProperty(name.trim(), icon);
    save((d) => ({ ...d, props: [...d.props, p] }));
    setSelectedId(p.id);
    setName("");
    setIcon(PROPERTY_ICONS[0]);
    setAdding(false);
  }

  function removeProperty(id: string) {
    save((d) => ({ ...d, props: d.props.filter((p) => p.id !== id) }));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  return (
    <div style={st.col}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {data.props.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedId(p.id);
              setAdding(false);
            }}
            style={{
              ...st.smBtn,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 5,
              ...(selected?.id === p.id ? { background: theme.borderInfo, color: theme.info } : {}),
            }}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
        <button
          onClick={() => setAdding((a) => !a)}
          style={{ ...st.smBtn, flexShrink: 0, background: "#166534", color: "#86efac" }}
        >
          {adding ? "✕" : "+ Añadir"}
        </button>
      </div>

      {adding && (
        <div style={{ ...st.card, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={st.secT}>Nuevo inmueble</div>
          <input
            placeholder="Nombre (p.ej. Piso centro)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={st.inp}
            autoFocus
          />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {PROPERTY_ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                style={{
                  ...st.smBtn,
                  fontSize: 16,
                  padding: "4px 9px",
                  ...(icon === ic ? { background: theme.borderInfo } : {}),
                }}
              >
                {ic}
              </button>
            ))}
          </div>
          <button onClick={addProperty} style={{ ...st.addBtn, padding: "6px 14px", background: "#166534", alignSelf: "flex-start" }}>
            Crear inmueble
          </button>
        </div>
      )}

      {!selected && !adding && (
        <div style={{ ...st.card, textAlign: "center", color: theme.textFaint, fontSize: 13 }}>
          Aún no tienes inmuebles — añade el primero con el botón "+ Añadir".
        </div>
      )}

      {selected && (
        <PropertyDetailTab
          key={selected.id}
          property={selected}
          calc={propCalc(selected, yearMode === 2)}
          yearMode={yearMode}
          save={save}
          onRemove={() => removeProperty(selected.id)}
        />
      )}
    </div>
  );
}
