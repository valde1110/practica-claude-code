import { useState } from "react";
import { st } from "../styles/shared";
import { theme } from "../styles/theme";
import { fm } from "../calc/format";
import { uid } from "../calc/format";
import { byCategory } from "../calc/budget";
import { EXP_CATS, INC_CATS } from "../data/categories";
import { AddForm, type ItemFormState } from "../components/shared/AddForm";
import { BRow } from "../components/shared/BRow";
import { ImportExpensesDialog } from "../components/shared/ImportExpensesDialog";
import type { AppState, BudgetItem } from "../types/models";
import type { AppContext } from "../types/context";
import type { SaveFn } from "../hooks/useAppData";

interface BudgetTabProps {
  data: AppState;
  save: SaveFn;
  cx: AppContext;
}

export function BudgetTab({ data, save, cx }: BudgetTabProps) {
  const [adding, setAdding] = useState<"inc" | "exp" | null>(null);
  const [form, setForm] = useState<ItemFormState>({ label: "", amt: "", cat: "" });
  const [importing, setImporting] = useState(false);

  function addImportedExpenses(items: BudgetItem[]) {
    if (items.length === 0) return;
    save((d) => ({ ...d, expenses: [...d.expenses, ...items] }));
  }

  function addItem(type: "inc" | "exp") {
    if (!form.label || !form.amt) return;
    const it = { id: uid(), cat: form.cat || "other", label: form.label, amt: parseFloat(form.amt) || 0 };
    if (type === "inc") save((d) => ({ ...d, incomes: [...d.incomes, it] }));
    else save((d) => ({ ...d, expenses: [...d.expenses, it] }));
    setForm({ label: "", amt: "", cat: "" });
    setAdding(null);
  }

  function rmItem(type: "inc" | "exp", id: string) {
    if (type === "inc") save((d) => ({ ...d, incomes: d.incomes.filter((x) => x.id !== id) }));
    else save((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) }));
  }

  function upAmt(type: "inc" | "exp", id: string, amt: number) {
    if (type === "inc") save((d) => ({ ...d, incomes: d.incomes.map((x) => (x.id === id ? { ...x, amt } : x)) }));
    else save((d) => ({ ...d, expenses: d.expenses.map((x) => (x.id === id ? { ...x, amt } : x)) }));
  }

  const net = cx.bInc - cx.bExp;
  const byCat = byCategory(data.expenses, EXP_CATS);

  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: theme.textFaint }}>Ingresos</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.success, fontFamily: theme.fontMono }}>{fm(cx.bInc)}</div>
          </div>
          <div style={{ width: 1, background: theme.borderSubtle }} />
          <div>
            <div style={{ fontSize: 10, color: theme.textFaint }}>Gastos</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.danger, fontFamily: theme.fontMono }}>{fm(-cx.bExp)}</div>
          </div>
          <div style={{ width: 1, background: theme.borderSubtle }} />
          <div>
            <div style={{ fontSize: 10, color: theme.textFaint }}>Neto</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: net >= 0 ? theme.success : theme.danger, fontFamily: theme.fontMono }}>
              {fm(net)}
            </div>
          </div>
        </div>
      </div>

      {byCat.length > 0 && (
        <div style={st.card}>
          <div style={st.secT}>Desglose por categoría</div>
          {byCat.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
              <span style={{ fontSize: 13 }}>{c.icon}</span>
              <span style={{ fontSize: 11, color: theme.textMuted, width: 80 }}>{c.label}</span>
              <div style={{ flex: 1, height: 16, background: theme.bgSubtle, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: c.pct * 100 + "%", height: "100%", background: c.color, borderRadius: 4, opacity: 0.7 }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: theme.fontMono, color: theme.textSecondary, minWidth: 48, textAlign: "right" }}>
                {c.sum}€
              </span>
              <span style={{ fontSize: 10, color: theme.textFaint, width: 28, textAlign: "right" }}>
                {Math.round(c.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={st.secT}>Ingresos mensuales</div>
          <button onClick={() => setAdding(adding === "inc" ? null : "inc")} style={st.addBtn}>
            {adding === "inc" ? "✕" : "+"}
          </button>
        </div>
        {adding === "inc" && <AddForm form={form} setForm={setForm} onAdd={() => addItem("inc")} cats={INC_CATS} />}
        {data.incomes.length === 0 && adding !== "inc" && (
          <div style={{ fontSize: 12, color: theme.textFaint }}>Aún no hay ingresos registrados.</div>
        )}
        {data.incomes.map((it) => (
          <BRow key={it.id} item={it} cats={INC_CATS} type="inc" onRm={() => rmItem("inc", it.id)} onAmt={(a) => upAmt("inc", it.id, a)} />
        ))}
      </div>

      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={st.secT}>Gastos mensuales</div>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => setImporting(true)} style={st.addBtn} title="Importar desde una foto">
              📷
            </button>
            <button onClick={() => setAdding(adding === "exp" ? null : "exp")} style={st.addBtn}>
              {adding === "exp" ? "✕" : "+"}
            </button>
          </div>
        </div>
        {adding === "exp" && <AddForm form={form} setForm={setForm} onAdd={() => addItem("exp")} cats={EXP_CATS} />}
        {data.expenses.length === 0 && adding !== "exp" && (
          <div style={{ fontSize: 12, color: theme.textFaint }}>Aún no hay gastos registrados.</div>
        )}
        {data.expenses.map((it) => (
          <BRow key={it.id} item={it} cats={EXP_CATS} type="exp" onRm={() => rmItem("exp", it.id)} onAmt={(a) => upAmt("exp", it.id, a)} />
        ))}
      </div>

      <div style={{ ...st.card, background: theme.bgInfo, border: `1px solid ${theme.borderInfo}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.info, marginBottom: 6 }}>🔥 Conexión FIRE</div>
        <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6, margin: "0 0 4px" }}>
          Sobrante personal ({fm(net)}) + rentas ({fm(cx.rentalFCL)}) ={" "}
          <strong style={{ color: theme.textPrimary }}>{fm(cx.disposable)}</strong>
        </p>
        <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6, margin: 0 }}>
          Inviertes {fm(data.fire.invest)}/mes. Sin asignar:{" "}
          <strong style={{ color: cx.disposable - data.fire.invest >= 0 ? theme.success : theme.danger }}>
            {fm(cx.disposable - data.fire.invest)}
          </strong>
        </p>
      </div>

      <ImportExpensesDialog
        open={importing}
        onClose={() => setImporting(false)}
        onConfirm={addImportedExpenses}
      />
    </div>
  );
}
