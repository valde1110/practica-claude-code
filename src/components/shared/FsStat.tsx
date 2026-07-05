import { theme } from "../../styles/theme";

interface FsStatProps {
  v: string;
  l: string;
  c?: string;
}

export function FsStat({ v, l, c }: FsStatProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: theme.fontMono, color: c || theme.textPrimary }}>
        {v}
      </span>
      <span style={{ fontSize: 9, color: theme.textFaint }}>{l}</span>
    </div>
  );
}
