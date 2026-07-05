import { theme } from "../../styles/theme";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 18,
          maxWidth: 320,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.textPrimary, marginBottom: message ? 6 : 14 }}>
          {title}
        </div>
        {message && <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 14 }}>{message}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: `1px solid ${theme.border}`,
              background: theme.bgSubtle,
              color: theme.textSecondary,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "none",
              background: danger ? theme.dangerBg : "#166534",
              color: danger ? theme.dangerText : "#86efac",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
