import { fm } from "../../calc/format";
import { theme } from "../../styles/theme";

interface DRowProps {
  l: string;
  v: number;
  green?: boolean;
  sub?: string;
  miss?: boolean;
}

export function DRow({ l, v, green, sub, miss }: DRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", ...(miss ? { opacity: 0.4 } : {}) }}>
      <div>
        <span style={{ color: theme.textSecondary, fontSize: 12 }}>{l}</span>
        {sub && <span style={{ color: theme.textFaint, fontSize: 10, marginLeft: 4 }}>({sub})</span>}
        {miss && <span style={{ color: theme.warning, fontSize: 10, marginLeft: 3 }}>est.</span>}
      </div>
      <span style={{ color: green ? theme.success : v < 0 ? theme.danger : theme.textSecondary, fontFamily: theme.fontMono, fontSize: 13 }}>
        {fm(v)}
      </span>
    </div>
  );
}
