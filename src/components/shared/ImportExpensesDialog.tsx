import { useRef, useState } from "react";
import { st } from "../../styles/shared";
import { theme } from "../../styles/theme";
import { recognizeText } from "../../lib/ocr";
import { parseExpenseLines } from "../../calc/importParser";
import { EXP_CATS } from "../../data/categories";
import { uid } from "../../calc/format";
import type { BudgetItem } from "../../types/models";

interface DraftRow {
  id: string;
  label: string;
  amt: string;
  cat: string;
}

interface ImportExpensesDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: BudgetItem[]) => void;
}

type Stage = "idle" | "loading" | "review" | "error";

export function ImportExpensesDialog({ open, onClose, onConfirm }: ImportExpensesDialogProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [rawText, setRawText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setStage("idle");
    setRows([]);
    setRawText("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setStage("loading");
    try {
      const text = await recognizeText(file);
      setRawText(text);
      const parsed = parseExpenseLines(text);
      setRows(
        parsed.map((p) => ({ id: uid(), label: p.label, amt: String(p.amt), cat: "other" }))
      );
      setStage("review");
    } catch (e) {
      setErrorMsg(
        "No se pudo analizar la imagen. La primera vez que usas esta función hace falta conexión a internet para descargar el modelo de reconocimiento — comprueba tu conexión e inténtalo de nuevo."
      );
      setStage("error");
    }
  }

  function updateRow(id: string, changes: Partial<DraftRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addBlankRow() {
    setRows((prev) => [...prev, { id: uid(), label: "", amt: "", cat: "other" }]);
  }

  function confirmRows() {
    const items: BudgetItem[] = rows
      .filter((r) => r.label.trim() && parseFloat(r.amt) > 0)
      .map((r) => ({ id: uid(), cat: r.cat, label: r.label.trim(), amt: parseFloat(r.amt) || 0 }));
    onConfirm(items);
    reset();
    onClose();
  }

  return (
    <div
      onClick={() => {
        reset();
        onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: "14px 14px 0 0",
          padding: 16,
          maxWidth: 640,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.textPrimary, marginBottom: 10 }}>
          📷 Importar gastos desde una foto
        </div>

        {stage === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5 }}>
              Sube una foto o captura de pantalla con una lista de gastos (por ejemplo, la tabla que te
              pasa alguien por WhatsApp). Detectaremos las líneas con importe y podrás revisarlas antes
              de añadirlas.
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={st.inp}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {stage === "loading" && (
          <div style={{ textAlign: "center", padding: "24px 0", color: theme.textMuted, fontSize: 13 }}>
            Analizando imagen… puede tardar unos segundos (la primera vez, un poco más).
          </div>
        )}

        {stage === "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: theme.dangerText, lineHeight: 1.5 }}>{errorMsg}</div>
            <button onClick={reset} style={st.smBtn}>
              Reintentar
            </button>
          </div>
        )}

        {stage === "review" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.length === 0 && (
              <div style={{ fontSize: 12, color: theme.textMuted }}>
                No se ha detectado ningún importe automáticamente. Puedes añadir líneas a mano abajo, o
                revisar el texto reconocido:
              </div>
            )}
            {rows.length === 0 && rawText && (
              <pre
                style={{
                  fontSize: 10,
                  color: theme.textFaint,
                  background: theme.bgSubtle,
                  padding: 8,
                  borderRadius: 8,
                  whiteSpace: "pre-wrap",
                  maxHeight: 120,
                  overflowY: "auto",
                }}
              >
                {rawText}
              </pre>
            )}

            {rows.map((r) => (
              <div key={r.id} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <select
                  value={r.cat}
                  onChange={(e) => updateRow(r.id, { cat: e.target.value })}
                  style={{ ...st.inp, width: 46, padding: "5px 2px" }}
                >
                  {EXP_CATS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon}
                    </option>
                  ))}
                </select>
                <input
                  value={r.label}
                  onChange={(e) => updateRow(r.id, { label: e.target.value })}
                  placeholder="Concepto"
                  style={{ ...st.inp, flex: 1 }}
                />
                <input
                  value={r.amt}
                  onChange={(e) => updateRow(r.id, { amt: e.target.value })}
                  type="number"
                  placeholder="€"
                  style={{ ...st.inp, width: 70 }}
                />
                <button
                  onClick={() => removeRow(r.id)}
                  style={{ background: "none", border: "none", color: theme.textDim, cursor: "pointer", fontSize: 13 }}
                >
                  🗑
                </button>
              </div>
            ))}

            <button onClick={addBlankRow} style={{ ...st.smBtn, alignSelf: "flex-start" }}>
              + Añadir línea manual
            </button>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => {
                  reset();
                  onClose();
                }}
                style={st.smBtn}
              >
                Cancelar
              </button>
              <button
                onClick={confirmRows}
                style={{ ...st.addBtn, background: "#166534", flex: 1, textAlign: "center" }}
                disabled={rows.filter((r) => r.label.trim() && parseFloat(r.amt) > 0).length === 0}
              >
                Añadir {rows.filter((r) => r.label.trim() && parseFloat(r.amt) > 0).length} gastos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
