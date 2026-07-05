import { st } from "../styles/shared";
import { theme } from "../styles/theme";
import { fm, fk, fp } from "../calc/format";
import { Kpi } from "../components/shared/Kpi";
import { Bar3 } from "../components/shared/Bar3";
import { PropMini } from "../components/shared/PropMini";
import { AlertBox } from "../components/shared/AlertBox";
import type { AppState, Alert } from "../types/models";
import type { AppContext } from "../types/context";

interface DashboardTabProps {
  data: AppState;
  cx: AppContext;
}

export function DashboardTab({ data, cx }: DashboardTabProps) {
  const alerts: (Alert & { prop: string })[] = data.props.flatMap((p) =>
    p.alerts.map((a) => ({ ...a, prop: p.name }))
  );
  const missingData = data.props.filter((p) => !p.ibiSet || !p.commSet);

  return (
    <div style={st.col}>
      <div style={st.kpiRow}>
        <Kpi l="FCL Inmuebles" v={fm(cx.rentalFCL)} s="/mes" ok={cx.rentalFCL >= 0} />
        <Kpi l="Disponible" v={fm(cx.disposable)} s="/mes" ok={cx.disposable >= 0} />
        <Kpi l="FIRE" v={fp(Math.min(cx.firePct, 1))} s={fk(cx.fireNum)} ok={cx.firePct > 0.05} />
        <Kpi l="Tasa ahorro" v={fp(cx.savRate)} s="del ingreso" ok={cx.savRate >= 0.2} />
      </div>

      <div style={st.card}>
        <div style={st.secT}>Balance mensual integrado</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Bar3 l="Ingresos" v={cx.bInc} c={theme.success} mx={Math.max(cx.bInc, cx.bExp, 1)} />
          <Bar3 l="Gastos" v={cx.bExp} c={theme.danger} mx={Math.max(cx.bInc, cx.bExp, 1)} />
          <Bar3
            l="Inmuebles"
            v={cx.rentalFCL}
            c={cx.rentalFCL >= 0 ? theme.accentBlue : theme.danger}
            mx={Math.max(cx.bInc, cx.bExp, 1)}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
            paddingTop: 8,
            borderTop: `1px solid ${theme.borderSubtle}`,
          }}
        >
          <span style={{ color: theme.textMuted, fontSize: 13 }}>Sobrante mensual</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: cx.disposable >= 0 ? theme.success : theme.danger,
              fontFamily: theme.fontMono,
            }}
          >
            {fm(cx.disposable)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: theme.textFaint }}>
          <span>Inversión: {fm(data.fire.invest)}</span>
          <span>Sin destino: {fm(cx.disposable - data.fire.invest)}</span>
        </div>
      </div>

      {data.props.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {data.props.map((p, i) => (
            <PropMini key={p.id} name={p.name} active={p.active} c={cx.propCalcs[i]} ic={p.icon} />
          ))}
        </div>
      )}

      {(alerts.length > 0 || missingData.length > 0) && (
        <div style={st.col}>
          <div style={st.secT}>Alertas</div>
          {alerts.map((a, i) => (
            <AlertBox key={i} a={a} />
          ))}
          {missingData.map((p) => (
            <AlertBox
              key={p.id}
              a={{ t: "warn", prop: "Datos", txt: `Pendiente: IBI ${p.name}, Comunidad ${p.name}` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
