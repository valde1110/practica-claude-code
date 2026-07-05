import { st } from "../../styles/shared";
import { theme } from "../../styles/theme";
import type { Category } from "../../types/models";

export interface ItemFormState {
  label: string;
  amt: string;
  cat: string;
}

interface AddFormProps {
  form: ItemFormState;
  setForm: (form: ItemFormState) => void;
  onAdd: () => void;
  cats: Category[];
}

export function AddForm({ form, setForm, onAdd, cats }: AddFormProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: 10, background: theme.bgSubtle, borderRadius: 8, marginBottom: 8 }}>
      <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} style={st.inp}>
        <option value="">Categoría...</option>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.label}
          </option>
        ))}
      </select>
      <input
        placeholder="Concepto"
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        style={st.inp}
      />
      <div style={{ display: "flex", gap: 5 }}>
        <input
          placeholder="€"
          type="number"
          value={form.amt}
          onChange={(e) => setForm({ ...form, amt: e.target.value })}
          style={{ ...st.inp, flex: 1 }}
        />
        <button onClick={onAdd} style={{ ...st.addBtn, padding: "5px 14px", background: "#166534" }}>
          Añadir
        </button>
      </div>
    </div>
  );
}
