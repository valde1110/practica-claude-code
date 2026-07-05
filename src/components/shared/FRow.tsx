import { fm } from "../../calc/format";
import { theme } from "../../styles/theme";

interface FRowProps {
  l: string;
  v: number;
  c: string;
  bold?: boolean;
}

export function FRow({ l, v, c, bold }: FRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span style={{ fontSize: 12, color: bold ? theme.textPrimary : theme.textMuted, fontWeight: bold ? 600 : 400 }}>
        {l}
      </span>
      <span style={{ fontFamily: theme.fontMono, fontSize: bold ? 14 : 12, color: c, fontWeight: bold ? 700 : 400 }}>
        {fm(v)}
      </span>
    </div>
  );
}
