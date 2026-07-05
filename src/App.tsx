import { useState } from "react";
import { st } from "./styles/shared";
import { theme } from "./styles/theme";
import { useAppData } from "./hooks/useAppData";
import { Header } from "./components/layout/Header";
import { TabNav, type TabId } from "./components/layout/TabNav";
import { DashboardTab } from "./tabs/DashboardTab";
import { BudgetTab } from "./tabs/BudgetTab";
import { PropertiesTab } from "./tabs/PropertiesTab";
import { FireTab } from "./tabs/FireTab";
import { YearlyTab } from "./tabs/YearlyTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { propCalc } from "./calc/property";
import { sumAmt } from "./calc/budget";
import { fireNumber, firePct as computeFirePct, savingsRate } from "./calc/fire";
import type { AppContext } from "./types/context";

export default function App() {
  const { data, loading, save, resetToBlank, loadSampleData } = useAppData();
  const [tab, setTab] = useState<TabId>("dash");

  if (loading || !data) {
    return (
      <div
        style={{
          background: theme.bg,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 48, color: theme.success }}>◉</div>
        <div style={{ color: theme.textFaint, marginTop: 16, fontSize: 13 }}>Cargando...</div>
      </div>
    );
  }

  const y2 = data.yearMode === 2;
  const propCalcs = data.props.map((p) => propCalc(p, y2));
  const rentalFCL = propCalcs.reduce((s, c) => s + c.fcl, 0);
  const bInc = sumAmt(data.incomes);
  const bExp = sumAmt(data.expenses);
  const bNet = bInc - bExp;
  const disposable = bInc + rentalFCL - bExp;
  const fireNum = fireNumber(data.fire);

  const cx: AppContext = {
    propCalcs,
    rentalFCL,
    bInc,
    bExp,
    bNet,
    disposable,
    fireNum,
    firePct: computeFirePct(data.fire, fireNum),
    savRate: savingsRate(data.fire, bInc, rentalFCL),
  };

  return (
    <div style={st.app}>
      <Header yearMode={data.yearMode} onToggleYear={() => save((d) => ({ ...d, yearMode: d.yearMode === 1 ? 2 : 1 }))} />
      <TabNav tab={tab} onChange={setTab} />
      <main style={st.main}>
        {tab === "dash" && <DashboardTab data={data} cx={cx} />}
        {tab === "budget" && <BudgetTab data={data} save={save} cx={cx} />}
        {tab === "props" && <PropertiesTab data={data} save={save} yearMode={data.yearMode} />}
        {tab === "fire" && <FireTab data={data} save={save} cx={cx} />}
        {tab === "yearly" && <YearlyTab data={data} save={save} />}
        {tab === "set" && (
          <SettingsTab data={data} save={save} resetToBlank={resetToBlank} loadSampleData={loadSampleData} />
        )}
      </main>
    </div>
  );
}
