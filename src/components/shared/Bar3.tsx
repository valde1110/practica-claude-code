import { fm } from "../../calc/format";
import { theme } from "../../styles/theme";

interface Bar3Props {
  l: string;
  v: number;
  c: string;
  mx: number;
}

export function Bar3({ l, v, c, mx }: Bar3Props) {
  const w = mx > 0 ? Math.min((Math.abs(v) / mx) * 100, 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: theme.textFaint, marginBottom: 3 }}>{l}</div>
      <div style={{ height: 22, background: theme.bgSubtle, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ width: w + "%", height: "100%", background: c, borderRadius: 5, opacity: 0.8 }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: c, fontFamily: theme.fontMono, marginTop: 3 }}>{fm(v)}</div>
    </div>
  );
}
