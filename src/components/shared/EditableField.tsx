import { useState } from "react";
import { st } from "../../styles/shared";

interface EditableFieldProps {
  value: number;
  onCommit: (value: number) => void;
  format?: (value: number) => string;
  width?: number;
  color?: string;
}

export function EditableField({ value, onCommit, format, width = 65, color }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState("");

  if (editing) {
    return (
      <div style={{ display: "flex", gap: 3 }}>
        <input
          type="number"
          value={tmp}
          onChange={(e) => setTmp(e.target.value)}
          style={{ ...st.inp, width }}
          autoFocus
        />
        <button
          onClick={() => {
            onCommit(parseFloat(tmp) || 0);
            setEditing(false);
          }}
          style={st.miniBtn}
        >
          ✓
        </button>
      </div>
    );
  }

  const display = format ? format(value) : String(value);
  return (
    <span
      onClick={() => {
        setTmp(String(value));
        setEditing(true);
      }}
      style={{ ...st.edVal, ...(color ? { color } : {}) }}
    >
      {display} ✎
    </span>
  );
}
