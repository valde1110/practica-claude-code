import { useState, useEffect, useCallback, useMemo } from "react";

const KEY = "fire-portfolio-v4";

const EXP_CATS = [
  { id: "food", label: "Alimentación", icon: "🛒", color: "#fb923c" },
  { id: "transport", label: "Transporte", icon: "🚗", color: "#fbbf24" },
  { id: "utilities", label: "Suministros", icon: "💡", color: "#a78bfa" },
  { id: "leisure", label: "Ocio", icon: "🎬", color: "#34d399" },
  { id: "health", label: "Salud", icon: "🏥", color: "#f472b6" },
  { id: "subs", label: "Suscripciones", icon: "📱", color: "#c084fc" },
  { id: "insurance", label: "Seguros", icon: "🛡", color: "#60a5fa" },
  { id: "other", label: "Otros", icon: "📦", color: "#94a3b8" },
];

const INC_CATS = [
  { id: "salary", label: "Nómina", icon: "💼", color: "#4ade80" },
  { id: "rental", label: "Alquileres", icon: "🏘", color: "#34d399" },
  { id: "freelance", label: "Freelance", icon: "💻", color: "#a78bfa" },
  { id: "other_inc", label: "Otros", icon: "💰", color: "#fbbf24" },
];

const PHASES = [
  { id: "papeleo", label: "En papeleo", bg: "#1f2937", fg: "#9ca3af" },
  { id: "reforma", label: "En reforma", bg: "#78350f", fg: "#fcd34d" },
  { id: "buscando", label: "Buscando inquilino", bg: "#1e3a5f", fg: "#93c5fd" },
  { id: "alquilado", label: "Alquilado", bg: "#065f46", fg: "#6ee7b7" },
];

function makeDefault() {
  return {
    props: [
      {
        id: "tor", name: "Torrejón de Ardoz", phase: "alquilado",
        rent: 900, mortM1: 558, mortM2: 634, rateY1: 1.95, rateY2: 2.95, mortTerm: 25, bank: "Ibercaja",
        insAnnual: 359.52, insLabel: "Ibervida",
        ibi: 0, community: 0, maint: 90, vacancy: 5,
        depBase: 152000, depRate: 3, price: 190000,
        ibiSet: false, commSet: false,
        alerts: [
          { t: "crit", txt: "Vivienda habitual declarada en escritura — riesgo ITP con CM si se alquila sin regularizar" },
          { t: "warn", txt: "Confirmar IBI y comunidad de propietarios para cerrar modelo FCL" }
        ]
      },
      {
        id: "zar", name: "Zarauz", phase: "papeleo",
        rent: 0, mortM1: 0, mortM2: 0, rateY1: 0, rateY2: 0, mortTerm: 0, bank: "",
        insAnnual: 220, insLabel: "Seguro hogar",
        ibi: 380, community: 70, maint: 100, vacancy: 5,
        depBase: 0, depRate: 0, price: 0,
        ibiSet: true, commSet: true,
        alerts: [{ t: "info", txt: "Sin ingresos previstos hasta finales de 2026" }]
      }
    ],
    fire: {
      invest: 750, portfolio: 0,
      target: 2500, returnRate: 7, swr: 4, appreciation: 2
    },
    incomesJuanma: [],
    incomesAmanda: [
      { id: "a1", cat: "salary", label: "Nómina", amt: 2200 }
    ],
    expenses: [
      { id: "e1", cat: "food", label: "Supermercado", amt: 350 },
      { id: "e2", cat: "transport", label: "Gasolina + transporte", amt: 150 },
      { id: "e3", cat: "utilities", label: "Luz, agua, gas, internet", amt: 120 },
      { id: "e4", cat: "leisure", label: "Ocio y restaurantes", amt: 200 },
      { id: "e5", cat: "subs", label: "Suscripciones", amt: 50 },
      { id: "e6", cat: "other", label: "Varios", amt: 100 },
    ],
    houseFund: {
      recurring: [],
      piggy: { balance: 0, goal: 0, log: [] }
    },
    reserve: 1500, reserveGoal: 6000,
    yearMode: 1, projYears: 15
  };
}

function fm(n) {
  if (n == null || isNaN(n)) return "—";
  var s = Math.abs(Math.round(n)).toLocaleString("es-ES");
  if (n < -0.5) return "−" + s + "€";
  if (n > 0.5) return "+" + s + "€";
  return "0€";
}

function fk(n) {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M€";
  if (Math.abs(n) >= 1000) return Math.round(n / 1000) + "k€";
  return fm(n);
}

function fp(n) { return (n * 100).toFixed(1) + "%"; }

function uid() { return Math.random().toString(36).slice(2, 9); }

function propCalc(p, y2) {
  var mort = y2 ? p.mortM2 : p.mortM1;
  var ins = p.insAnnual / 12;
  var ibi = p.ibi / 12;
  var comm = p.community;
  var mnt = p.maint;
  var vac = p.rent * p.vacancy / 100;
  var dep = p.depBase * p.depRate / 100 / 12;
  var oper = ins + comm + mnt + vac;
  var exp = mort + oper + ibi;
  var fcl = p.rent - exp;
  var bruta = p.price > 0 ? (p.rent * 12 / p.price) : 0;
  var neta = p.price > 0 ? (fcl * 12 / p.price) : 0;
  return { income: p.rent, mort: mort, ins: ins, ibi: ibi, comm: comm, mnt: mnt, vac: vac, oper: oper, exp: exp, fcl: fcl, dep: dep, bruta: bruta, neta: neta };
}

var TABS = [
  { id: "dash", lbl: "Panel", ic: "◉" },
  { id: "inc", lbl: "Ingresos", ic: "💰" },
  { id: "exp", lbl: "Gastos", ic: "💳" },
  { id: "casa", lbl: "Casa", ic: "🏡" },
  { id: "props", lbl: "Inmuebles", ic: "🏠" },
  { id: "fire", lbl: "FIRE", ic: "🔥" },
  { id: "yearly", lbl: "Proyección", ic: "📊" },
  { id: "set", lbl: "⚙", ic: "" },
];

export default function App() {
  var _s = useState(null), data = _s[0], setData = _s[1];
  var _t = useState("dash"), tab = _t[0], setTab = _t[1];
  var _l = useState(true), loading = _l[0], setLoading = _l[1];

  useEffect(function () {
    loadData();
  }, []);

  async function loadData() {
    try {
      var r = await window.storage.get(KEY);
      if (r && r.value) {
        setData(JSON.parse(r.value));
      } else {
        setData(makeDefault());
      }
    } catch (e) {
      setData(makeDefault());
    }
    setLoading(false);
  }

  async function save(nd) {
    setData(nd);
    try { await window.storage.set(KEY, JSON.stringify(nd)); } catch (e) { }
  }

  if (loading || !data) {
    return (
      <div style={{ background: "#0f1117", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: 48, color: "#4ade80" }}>◉</div>
        <div style={{ color: "#6b7280", marginTop: 16, fontSize: 13 }}>Cargando...</div>
      </div>
    );
  }

  var y2 = data.yearMode === 2;
  var tc = propCalc(data.props[0], y2);
  var zc = propCalc(data.props[1], y2);
  var rentalFCL = tc.fcl + zc.fcl;
  var incJuanmaManual = data.incomesJuanma.reduce(function (s, i) { return s + i.amt; }, 0);
  var incJuanma = incJuanmaManual + rentalFCL;
  var incAmanda = data.incomesAmanda.reduce(function (s, i) { return s + i.amt; }, 0);
  var bInc = incJuanma + incAmanda;
  var bExp = data.expenses.reduce(function (s, e) { return s + e.amt; }, 0);
  var disposable = bInc - bExp;
  var fireNum = data.fire.target * 12 / (data.fire.swr / 100);
  var firePct = fireNum > 0 ? data.fire.portfolio / fireNum : 0;
  var savRate = bInc > 0 ? data.fire.invest / bInc : 0;

  var cx = { tc: tc, zc: zc, rentalFCL: rentalFCL, incJuanma: incJuanma, incAmanda: incAmanda, bInc: bInc, bExp: bExp, disposable: disposable, fireNum: fireNum, firePct: firePct, savRate: savRate };

  return (
    <div style={st.app}>
      <header style={st.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 22, color: "#4ade80" }}>◉</span>
          <div>
            <div style={st.title}>FIRE Portfolio</div>
            <div style={st.sub}>Pata Financiera · Pata Inmobiliaria</div>
          </div>
        </div>
        <span style={st.yrBadge} onClick={function () { save(Object.assign({}, data, { yearMode: data.yearMode === 1 ? 2 : 1 })); }}>
          Año {data.yearMode}
        </span>
      </header>

      <nav style={st.nav}>
        {TABS.map(function (t) {
          return (
            <button key={t.id} onClick={function () { setTab(t.id); }}
              style={Object.assign({}, st.navBtn, tab === t.id ? st.navAct : {})}>
              {t.ic ? <span style={{ fontSize: 15 }}>{t.ic}</span> : null}
              <span style={{ fontSize: 9 }}>{t.lbl}</span>
            </button>
          );
        })}
      </nav>

      <main style={st.main}>
        {tab === "dash" && <DashTab data={data} cx={cx} setTab={setTab} />}
        {tab === "inc" && <IncomeTab data={data} save={save} cx={cx} />}
        {tab === "exp" && <ExpenseTab data={data} save={save} cx={cx} setTab={setTab} />}
        {tab === "casa" && <CasaTab data={data} save={save} />}
        {tab === "props" && <PropsTab data={data} save={save} ym={data.yearMode} />}
        {tab === "fire" && <FireTab data={data} save={save} cx={cx} />}
        {tab === "yearly" && <YearTab data={data} cx={cx} save={save} />}
        {tab === "set" && <SetTab data={data} save={save} />}
      </main>
    </div>
  );
}

/* ===== DASHBOARD ===== */
function DashTab(p) {
  var d = p.data, cx = p.cx, setTab = p.setTab;
  var alerts = d.props.reduce(function (acc, pr) {
    return acc.concat(pr.alerts.map(function (a) { return Object.assign({}, a, { prop: pr.name }); }));
  }, []);
  var missing = d.props.filter(function (pr) { return !pr.ibiSet || !pr.commSet; });

  return (
    <div style={st.col}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div onClick={function () { setTab("fire"); }} style={Object.assign({}, st.card, { cursor: "pointer" })}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>💼 Pata Financiera</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#4ade80", marginTop: 4 }}>{fp(Math.min(cx.firePct, 1))}</div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>hacia FIRE</div>
        </div>
        <div onClick={function () { setTab("props"); }} style={Object.assign({}, st.card, { cursor: "pointer" })}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>🏠 Pata Inmobiliaria</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: cx.rentalFCL >= 0 ? "#4ade80" : "#f87171", marginTop: 4 }}>{fm(cx.rentalFCL)}</div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>FCL/mes</div>
        </div>
      </div>

      <div style={st.kpiRow}>
        <Kpi l="Disponible" v={fm(cx.disposable)} s="/mes" ok={cx.disposable >= 0} />
        <Kpi l="FIRE" v={fp(Math.min(cx.firePct, 1))} s={fk(cx.fireNum)} ok={cx.firePct > 0.05} />
        <Kpi l="Tasa ahorro" v={fp(cx.savRate)} s="del ingreso" ok={cx.savRate >= 0.2} />
        <Kpi l="FCL Inmuebles" v={fm(cx.rentalFCL)} s="/mes" ok={cx.rentalFCL >= 0} />
      </div>

      <div style={st.card}>
        <div style={st.secT}>Balance mensual integrado</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Bar3 l="Ing. Juanma" v={cx.incJuanma} c="#4ade80" mx={Math.max(cx.incJuanma, cx.incAmanda, cx.bExp, 1)} />
          <Bar3 l="Ing. Amanda" v={cx.incAmanda} c="#34d399" mx={Math.max(cx.incJuanma, cx.incAmanda, cx.bExp, 1)} />
          <Bar3 l="Gastos" v={cx.bExp} c="#f87171" mx={Math.max(cx.incJuanma, cx.incAmanda, cx.bExp, 1)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #2a2d35" }}>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>Disponible mensual</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: cx.disposable >= 0 ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>{fm(cx.disposable)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280" }}>
          <span>Inversión: {fm(d.fire.invest)}</span>
          <span>Sin destino: {fm(cx.disposable - d.fire.invest)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
        {d.props.map(function (pr, i) {
          var c = i === 0 ? cx.tc : cx.zc;
          return <PropMini key={pr.id} name={pr.name} phase={pr.phase} c={c} ic={i === 0 ? "🏠" : "🏖"} />;
        })}
      </div>

      {(alerts.length > 0 || missing.length > 0) && (
        <div style={st.col}>
          <div style={st.secT}>Alertas</div>
          {alerts.map(function (a, i) { return <AlertBox key={i} a={a} />; })}
          {missing.length > 0 && <AlertBox a={{ t: "warn", prop: "Datos", txt: "Pendiente: " + missing.map(function (pr) { return pr.name; }).join(", ") }} />}
        </div>
      )}
    </div>
  );
}

function Bar3(p) {
  var w = p.mx > 0 ? Math.min(Math.abs(p.v) / p.mx * 100, 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>{p.l}</div>
      <div style={{ height: 22, background: "#1a1d24", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ width: w + "%", height: "100%", background: p.c, borderRadius: 5, opacity: 0.8 }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: p.c, fontFamily: "monospace", marginTop: 3 }}>{fm(p.v)}</div>
    </div>
  );
}

/* ===== INGRESOS ===== */
function IncomeTab(p) {
  var d = p.data, save = p.save, cx = p.cx;
  var _a = useState(null), adding = _a[0], setAdding = _a[1];
  var _f = useState({ label: "", amt: "", cat: "" }), form = _f[0], setForm = _f[1];
  var manualCats = INC_CATS.filter(function (c) { return c.id !== "rental"; });

  function addItem(key) {
    if (!form.label || !form.amt) return;
    var it = { id: uid(), cat: form.cat || "other_inc", label: form.label, amt: parseFloat(form.amt) || 0 };
    var changes = {}; changes[key] = d[key].concat([it]);
    save(Object.assign({}, d, changes));
    setForm({ label: "", amt: "", cat: "" }); setAdding(null);
  }
  function rmItem(key, id) {
    var changes = {}; changes[key] = d[key].filter(function (x) { return x.id !== id; });
    save(Object.assign({}, d, changes));
  }
  function upAmt(key, id, amt) {
    var changes = {}; changes[key] = d[key].map(function (x) { return x.id === id ? Object.assign({}, x, { amt: amt }) : x; });
    save(Object.assign({}, d, changes));
  }

  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={st.secT}>Juanma</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: "1px solid #1f2937" }}>
          <span style={{ fontSize: 15 }}>🏘</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#d1d5db" }}>Alquileres (Inmuebles)</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>🔗 automático · ver pestaña Inmuebles</div>
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: cx.rentalFCL >= 0 ? "#4ade80" : "#f87171" }}>{fm(cx.rentalFCL)}</span>
        </div>
        {d.incomesJuanma.map(function (it) {
          return <BRow key={it.id} item={it} cats={manualCats} type="inc" onRm={function () { rmItem("incomesJuanma", it.id); }} onAmt={function (a) { upAmt("incomesJuanma", it.id, a); }} />;
        })}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <button onClick={function () { setAdding(adding === "ju" ? null : "ju"); }} style={st.addBtn}>{adding === "ju" ? "✕" : "+ Añadir ingreso"}</button>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4ade80" }}>{fm(cx.incJuanma)}</span>
        </div>
        {adding === "ju" && <AddForm form={form} setForm={setForm} onAdd={function () { addItem("incomesJuanma"); }} cats={manualCats} />}
      </div>

      <div style={st.card}>
        <div style={st.secT}>Amanda</div>
        {d.incomesAmanda.map(function (it) {
          return <BRow key={it.id} item={it} cats={manualCats} type="inc" onRm={function () { rmItem("incomesAmanda", it.id); }} onAmt={function (a) { upAmt("incomesAmanda", it.id, a); }} />;
        })}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <button onClick={function () { setAdding(adding === "am" ? null : "am"); }} style={st.addBtn}>{adding === "am" ? "✕" : "+ Añadir ingreso"}</button>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#4ade80" }}>{fm(cx.incAmanda)}</span>
        </div>
        {adding === "am" && <AddForm form={form} setForm={setForm} onAdd={function () { addItem("incomesAmanda"); }} cats={manualCats} />}
      </div>

      <div style={Object.assign({}, st.card, { textAlign: "center" })}>
        <div style={{ fontSize: 11, color: "#6b7280" }}>Ingresos del hogar</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "#4ade80" }}>{fm(cx.bInc)}</div>
      </div>
    </div>
  );
}

/* ===== GASTOS ===== */
function ExpenseTab(p) {
  var d = p.data, save = p.save, cx = p.cx, setTab = p.setTab;
  var _a = useState(false), adding = _a[0], setAdding = _a[1];
  var _f = useState({ label: "", amt: "", cat: "" }), form = _f[0], setForm = _f[1];
  var _pi = useState(false), showProps = _pi[0], setShowProps = _pi[1];

  function addItem() {
    if (!form.label || !form.amt) return;
    var it = { id: uid(), cat: form.cat || "other", label: form.label, amt: parseFloat(form.amt) || 0 };
    save(Object.assign({}, d, { expenses: d.expenses.concat([it]) }));
    setForm({ label: "", amt: "", cat: "" }); setAdding(false);
  }
  function rmItem(id) {
    save(Object.assign({}, d, { expenses: d.expenses.filter(function (x) { return x.id !== id; }) }));
  }
  function upAmt(id, amt) {
    save(Object.assign({}, d, { expenses: d.expenses.map(function (x) { return x.id === id ? Object.assign({}, x, { amt: amt }) : x; }) }));
  }

  var net = cx.bInc - cx.bExp;
  var byCat = EXP_CATS.map(function (c) {
    var sum = d.expenses.filter(function (e) { return e.cat === c.id; }).reduce(function (s, e) { return s + e.amt; }, 0);
    return Object.assign({}, c, { sum: sum });
  }).filter(function (c) { return c.sum > 0; }).sort(function (a, b) { return b.sum - a.sum; });

  var propsExp = cx.tc.exp + cx.zc.exp;

  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div><div style={{ fontSize: 10, color: "#6b7280" }}>Ingresos hogar</div><div style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", fontFamily: "monospace" }}>{fm(cx.bInc)}</div></div>
          <div style={{ width: 1, background: "#2a2d35" }} />
          <div><div style={{ fontSize: 10, color: "#6b7280" }}>Gastos (Juanma)</div><div style={{ fontSize: 20, fontWeight: 700, color: "#f87171", fontFamily: "monospace" }}>{fm(-cx.bExp)}</div></div>
          <div style={{ width: 1, background: "#2a2d35" }} />
          <div><div style={{ fontSize: 10, color: "#6b7280" }}>Disponible</div><div style={{ fontSize: 20, fontWeight: 700, color: net >= 0 ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>{fm(net)}</div></div>
        </div>
      </div>

      {byCat.length > 0 && (
        <div style={st.card}>
          <div style={st.secT}>Desglose por categoría</div>
          {byCat.map(function (c) {
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                <span style={{ fontSize: 13 }}>{c.icon}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", width: 80 }}>{c.label}</span>
                <div style={{ flex: 1, height: 16, background: "#1a1d24", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: (c.sum / cx.bExp * 100) + "%", height: "100%", background: c.color, borderRadius: 4, opacity: 0.7 }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#d1d5db", minWidth: 48, textAlign: "right" }}>{c.sum}€</span>
                <span style={{ fontSize: 10, color: "#6b7280", width: 28, textAlign: "right" }}>{Math.round(c.sum / cx.bExp * 100)}%</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={st.secT}>Gastos mensuales (Juanma)</div>
          <button onClick={function () { setAdding(!adding); }} style={st.addBtn}>{adding ? "✕" : "+"}</button>
        </div>
        {adding && <AddForm form={form} setForm={setForm} onAdd={addItem} cats={EXP_CATS} />}
        {d.expenses.map(function (it) {
          return <BRow key={it.id} item={it} cats={EXP_CATS} type="exp" onRm={function () { rmItem(it.id); }} onAmt={function (a) { upAmt(it.id, a); }} />;
        })}
      </div>

      <div style={st.card}>
        <div onClick={function () { setShowProps(!showProps); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <div style={st.secT}>Gastos de inmuebles <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 400 }}>(informativo)</span></div>
          <span style={{ color: "#6b7280" }}>{showProps ? "▲" : "▼"}</span>
        </div>
        {!showProps && <div style={{ fontSize: 11, color: "#6b7280" }}>Total: {fm(-propsExp)}/mes · no se resta de tu disponible</div>}
        {showProps && (
          <div style={{ marginTop: 6 }}>
            <DRow l={d.props[0].name} v={-cx.tc.exp} />
            <DRow l={d.props[1].name} v={-cx.zc.exp} />
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid #2a2d35", marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Total inmuebles</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#f87171" }}>{fm(-propsExp)}</span>
            </div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>Ya descontado del FCL de cada propiedad — no se resta de tu disponible aquí.</div>
          </div>
        )}
      </div>

      <div onClick={function () { setTab("casa"); }} style={Object.assign({}, st.card, { cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" })}>
        <span style={{ fontSize: 13, color: "#93c5fd" }}>🏡 Ver gastos compartidos y hucha de la Casa</span>
        <span style={{ color: "#6b7280" }}>→</span>
      </div>
    </div>
  );
}

function AddForm(p) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: 10, background: "#1a1d24", borderRadius: 8, marginBottom: 8 }}>
      <select value={p.form.cat} onChange={function (e) { p.setForm(Object.assign({}, p.form, { cat: e.target.value })); }} style={st.inp}>
        <option value="">Categoría...</option>
        {p.cats.map(function (c) { return <option key={c.id} value={c.id}>{c.icon} {c.label}</option>; })}
      </select>
      <input placeholder="Concepto" value={p.form.label} onChange={function (e) { p.setForm(Object.assign({}, p.form, { label: e.target.value })); }} style={st.inp} />
      <div style={{ display: "flex", gap: 5 }}>
        <input placeholder="€" type="number" value={p.form.amt} onChange={function (e) { p.setForm(Object.assign({}, p.form, { amt: e.target.value })); }} style={Object.assign({}, st.inp, { flex: 1 })} />
        <button onClick={p.onAdd} style={Object.assign({}, st.addBtn, { padding: "5px 14px", background: "#166534" })}>Añadir</button>
      </div>
    </div>
  );
}

function BRow(p) {
  var _e = useState(false), ed = _e[0], setEd = _e[1];
  var _t = useState(""), tmp = _t[0], setTmp = _t[1];
  var cat = p.cats.find(function (c) { return c.id === p.item.cat; });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: "1px solid #1f2937" }}>
      <span style={{ fontSize: 15 }}>{cat ? cat.icon : "📦"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "#d1d5db" }}>{p.item.label}</div>
        <div style={{ fontSize: 10, color: "#6b7280" }}>{cat ? cat.label : ""}</div>
      </div>
      {ed ? (
        <div style={{ display: "flex", gap: 3 }}>
          <input type="number" value={tmp} onChange={function (e) { setTmp(e.target.value); }} style={Object.assign({}, st.inp, { width: 65, padding: "3px 5px" })} autoFocus />
          <button onClick={function () { p.onAmt(parseFloat(tmp) || 0); setEd(false); }} style={st.miniBtn}>✓</button>
        </div>
      ) : (
        <span onClick={function () { setEd(true); setTmp(String(p.item.amt)); }}
          style={{ fontFamily: "monospace", fontSize: 13, color: p.type === "inc" ? "#4ade80" : "#f87171", cursor: "pointer", padding: "3px 7px", background: "#1a1d24", borderRadius: 6 }}>
          {p.type === "inc" ? "+" : "−"}{p.item.amt}€ ✎
        </span>
      )}
      <button onClick={p.onRm} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 13 }}>🗑</button>
    </div>
  );
}

/* ===== CASA ===== */
function CasaTab(p) {
  var d = p.data, save = p.save;
  var _a = useState(false), adding = _a[0], setAdding = _a[1];
  var _f = useState({ label: "", amt: "", cat: "" }), form = _f[0], setForm = _f[1];
  var _per = useState("Juanma"), person = _per[0], setPerson = _per[1];

  var recurring = d.houseFund.recurring;
  var totalRecurring = recurring.reduce(function (s, e) { return s + e.amt; }, 0);
  var piggy = d.houseFund.piggy;
  var pct = piggy.goal > 0 ? Math.min(piggy.balance / piggy.goal * 100, 100) : 0;

  function addRec() {
    if (!form.label || !form.amt) return;
    var it = { id: uid(), cat: form.cat || "other", label: form.label, amt: parseFloat(form.amt) || 0 };
    save(Object.assign({}, d, { houseFund: Object.assign({}, d.houseFund, { recurring: recurring.concat([it]) }) }));
    setForm({ label: "", amt: "", cat: "" }); setAdding(false);
  }
  function rmRec(id) {
    save(Object.assign({}, d, { houseFund: Object.assign({}, d.houseFund, { recurring: recurring.filter(function (x) { return x.id !== id; }) }) }));
  }
  function upRecAmt(id, amt) {
    save(Object.assign({}, d, { houseFund: Object.assign({}, d.houseFund, { recurring: recurring.map(function (x) { return x.id === id ? Object.assign({}, x, { amt: amt }) : x; }) }) }));
  }
  function addPiggy(amt) {
    var entry = { id: uid(), date: new Date().toISOString().slice(0, 10), person: person, amt: amt };
    var npf = Object.assign({}, piggy, { balance: piggy.balance + amt, log: [entry].concat(piggy.log).slice(0, 20) });
    save(Object.assign({}, d, { houseFund: Object.assign({}, d.houseFund, { piggy: npf }) }));
  }
  function setBalance(v) {
    save(Object.assign({}, d, { houseFund: Object.assign({}, d.houseFund, { piggy: Object.assign({}, piggy, { balance: parseFloat(v) || 0 }) }) }));
  }
  function setGoal(v) {
    save(Object.assign({}, d, { houseFund: Object.assign({}, d.houseFund, { piggy: Object.assign({}, piggy, { goal: parseFloat(v) || 0 }) }) }));
  }

  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={st.secT}>Gastos recurrentes del hogar</div>
          <button onClick={function () { setAdding(!adding); }} style={st.addBtn}>{adding ? "✕" : "+"}</button>
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Informativo: lo que pagáis entre los dos cada mes de forma recurrente.</div>
        {adding && <AddForm form={form} setForm={setForm} onAdd={addRec} cats={EXP_CATS} />}
        {recurring.map(function (it) {
          return <BRow key={it.id} item={it} cats={EXP_CATS} type="exp" onRm={function () { rmRec(it.id); }} onAmt={function (a) { upRecAmt(it.id, a); }} />;
        })}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid #2a2d35", marginTop: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Total recurrente</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{fm(-totalRecurring)}</span>
        </div>
      </div>

      <div style={st.card}>
        <div style={st.secT}>Hucha de arreglos</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ flex: 1, height: 16, background: "#1f2937", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: pct + "%", height: "100%", borderRadius: 4, background: pct >= 80 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444" }} />
          </div>
          <span style={{ color: "#e5e7eb", fontWeight: 600, fontFamily: "monospace", fontSize: 13 }}>{fm(piggy.balance)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginBottom: 8 }}>
          <span>0€</span><span>Meta: {piggy.goal > 0 ? fm(piggy.goal) : "sin definir"}</span>
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
          {["Juanma", "Amanda"].map(function (name) {
            return <button key={name} onClick={function () { setPerson(name); }} style={Object.assign({}, st.smBtn, person === name ? { background: "#1e3a5f", color: "#93c5fd" } : {})}>{name}</button>;
          })}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[20, 50, 100].map(function (n) {
            return <button key={n} onClick={function () { addPiggy(n); }} style={st.smBtn}>+{n}€ ({person})</button>;
          })}
          <button onClick={function () { var v = prompt("Nuevo saldo:"); if (v) setBalance(v); }} style={Object.assign({}, st.smBtn, { background: "#1f2937" })}>Ajustar</button>
          <button onClick={function () { var v = prompt("Meta (€):"); if (v) setGoal(v); }} style={Object.assign({}, st.smBtn, { background: "#1f2937" })}>Definir meta</button>
        </div>
        {piggy.log.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Últimas aportaciones</div>
            {piggy.log.slice(0, 5).map(function (l) {
              return (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: "1px solid #1f2937" }}>
                  <span style={{ color: "#9ca3af" }}>{l.date} · {l.person}</span>
                  <span style={{ fontFamily: "monospace", color: "#4ade80" }}>+{l.amt}€</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 10 }}>Aportación manual por ahora — la automatizaremos más adelante.</div>
      </div>
    </div>
  );
}

/* ===== INMUEBLES ===== */
function PropsTab(p) {
  var d = p.data, save = p.save, ym = p.ym;
  var _ex = useState(null), expandedId = _ex[0], setExpanded = _ex[1];

  var calcs = d.props.map(function (pr) { return propCalc(pr, ym === 2); });
  var totalRent = calcs.reduce(function (s, c) { return s + c.income; }, 0);
  var totalFcl = calcs.reduce(function (s, c) { return s + c.fcl; }, 0);
  var alquilados = d.props.filter(function (pr) { return pr.phase === "alquilado"; }).length;

  function upProp(idx, changes) {
    var np = d.props.map(function (pr, i) { return i === idx ? Object.assign({}, pr, changes) : pr; });
    save(Object.assign({}, d, { props: np }));
  }

  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={st.secT}>Cartera inmobiliaria</div>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginTop: 6 }}>
          <div><div style={{ fontSize: 10, color: "#6b7280" }}>Renta total</div><div style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace", color: "#4ade80" }}>{fm(totalRent)}</div></div>
          <div><div style={{ fontSize: 10, color: "#6b7280" }}>FCL total</div><div style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace", color: totalFcl >= 0 ? "#4ade80" : "#f87171" }}>{fm(totalFcl)}</div></div>
          <div><div style={{ fontSize: 10, color: "#6b7280" }}>Alquilados</div><div style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace" }}>{alquilados}/{d.props.length}</div></div>
        </div>
      </div>

      {d.props.map(function (pr, i) {
        return (
          <PropCard key={pr.id} pr={pr} c={calcs[i]} ym={ym}
            expanded={expandedId === pr.id}
            onToggle={function () { setExpanded(expandedId === pr.id ? null : pr.id); }}
            up={function (ch) { upProp(i, ch); }} />
        );
      })}
    </div>
  );
}

function PropCard(p) {
  var pr = p.pr, c = p.c;
  var ph = PHASES.find(function (x) { return x.id === pr.phase; }) || PHASES[0];
  return (
    <div style={st.card}>
      <div onClick={p.onToggle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>{pr.name}</div>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, fontWeight: 600, background: ph.bg, color: ph.fg }}>{ph.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#6b7280" }}>FCL</div>
            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: c.fcl >= 0 ? "#4ade80" : "#f87171" }}>{fm(c.fcl)}</div>
          </div>
          <span style={{ color: "#6b7280", fontSize: 12 }}>{p.expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {p.expanded && <PropDetail pr={pr} c={c} up={p.up} ym={p.ym} />}
    </div>
  );
}

function PropDetail(p) {
  var pr = p.pr, c = p.c, up = p.up, ym = p.ym;
  var _e = useState(null), ed = _e[0], setEd = _e[1];
  var _t = useState(""), tmp = _t[0], setTmp = _t[1];

  var fields = [
    { k: "rent", l: "Renta mensual", u: "€/mes" },
    { k: "ibi", l: "IBI anual", u: "€/año", miss: !pr.ibiSet },
    { k: "community", l: "Comunidad", u: "€/mes", miss: !pr.commSet },
    { k: "maint", l: "Provisión mto.", u: "€/mes" },
    { k: "vacancy", l: "Vacancia", u: "%" },
  ];

  function commitField(k) {
    var val = parseFloat(tmp) || 0;
    var changes = {};
    changes[k] = val;
    if (k === "ibi") changes.ibiSet = true;
    if (k === "community") changes.commSet = true;
    up(changes);
    setEd(null);
  }

  return (
    <div style={{ marginTop: 10, borderTop: "1px solid #2a2d35", paddingTop: 10 }}>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {PHASES.map(function (ph) {
          return <button key={ph.id} onClick={function () { up({ phase: ph.id }); }}
            style={Object.assign({}, st.smBtn, pr.phase === ph.id ? { background: ph.bg, color: ph.fg } : {})}>{ph.label}</button>;
        })}
      </div>

      {pr.mortM1 > 0 && (
        <div style={{ background: "#1a1d24", borderRadius: 8, padding: 10, border: "1px solid #2a2d35", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>Hipoteca {pr.bank}</span>
            <span style={{ color: "#e5e7eb", fontWeight: 600, fontSize: 13 }}>{fm(-c.mort)}/mes</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 5, fontSize: 11, color: "#6b7280" }}>
            <span>Tipo: {ym === 1 ? pr.rateY1 : pr.rateY2}%</span>
            <span>Plazo: {pr.mortTerm}a</span>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 4 }}>
        <div style={st.blockT}>Parámetros</div>
        {fields.map(function (f) {
          return (
            <div key={f.k} style={Object.assign({}, st.editRow, f.miss ? { borderLeft: "3px solid #fbbf24" } : {})}>
              <span style={{ color: "#9ca3af", fontSize: 12, flex: 1 }}>
                {f.l}{f.miss ? <span style={{ color: "#fbbf24", fontSize: 10, marginLeft: 4 }}>⚠</span> : null}
              </span>
              {ed === f.k ? (
                <div style={{ display: "flex", gap: 3 }}>
                  <input type="number" value={tmp} onChange={function (e) { setTmp(e.target.value); }}
                    style={Object.assign({}, st.inp, { width: 65 })} autoFocus />
                  <button onClick={function () { commitField(f.k); }} style={st.miniBtn}>✓</button>
                </div>
              ) : (
                <span onClick={function () { setEd(f.k); setTmp(String(pr[f.k])); }} style={st.edVal}>
                  {pr[f.k]} {f.u} ✎
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={st.blockT}>Financiación</div>
        <DRow l="Renta" v={c.income} green={true} />
        <DRow l="Hipoteca" v={-c.mort} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={st.blockT}>Fiscalidad</div>
        <DRow l="IBI" v={-c.ibi} miss={!pr.ibiSet} />
        {c.dep > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.6, fontSize: 11, padding: "4px 0" }}>
            <span>Deducción amortización</span><span style={{ color: "#93c5fd" }}>{fm(c.dep)}/mes fiscal</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={st.blockT}>Operación</div>
        <DRow l="Seguro" v={-c.ins} sub={pr.insLabel} />
        <DRow l="Comunidad" v={-c.comm} miss={!pr.commSet} />
        <DRow l="Mantenimiento" v={-c.mnt} />
        <DRow l="Vacancia" v={-c.vac} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #374151", marginTop: 8 }}>
        <span style={{ fontWeight: 700 }}>FCL</span>
        <span style={{ fontWeight: 700, fontSize: 17, color: c.fcl >= 0 ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>{fm(c.fcl)}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, paddingTop: 8, borderTop: "1px dashed #374151" }}>
        <FsStat v={fp(c.bruta)} l="rent. bruta" />
        <FsStat v={fp(c.neta)} l="rent. neta" c={c.neta >= 0 ? "#4ade80" : "#f87171"} />
      </div>

      {pr.alerts.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={st.blockT}>Alertas</div>
          {pr.alerts.map(function (a, i) { return <AlertBox key={i} a={Object.assign({}, a, { prop: pr.name })} />; })}
        </div>
      )}
    </div>
  );
}

function DRow(p) {
  return (
    <div style={Object.assign({ display: "flex", justifyContent: "space-between", padding: "4px 0" }, p.miss ? { opacity: 0.4 } : {})}>
      <div>
        <span style={{ color: "#d1d5db", fontSize: 12 }}>{p.l}</span>
        {p.sub ? <span style={{ color: "#6b7280", fontSize: 10, marginLeft: 4 }}>({p.sub})</span> : null}
        {p.miss ? <span style={{ color: "#fbbf24", fontSize: 10, marginLeft: 3 }}>est.</span> : null}
      </div>
      <span style={{ color: p.green ? "#4ade80" : (p.v < 0 ? "#f87171" : "#d1d5db"), fontFamily: "monospace", fontSize: 13 }}>{fm(p.v)}</span>
    </div>
  );
}

/* ===== FIRE ===== */
function FireTab(p) {
  var d = p.data, save = p.save, cx = p.cx;
  var _e = useState(null), ed = _e[0], setEd = _e[1];
  var _t = useState(""), tmp = _t[0], setTmp = _t[1];

  var mr = d.fire.returnRate / 100 / 12;
  var mo = 0, port = d.fire.portfolio;
  while (port < cx.fireNum && mo < 720) { port = port * (1 + mr) + d.fire.invest; mo++; }
  var yToFire = mo < 720 ? (mo / 12).toFixed(1) : "60+";

  var resPct = d.reserveGoal > 0 ? Math.min(d.reserve / d.reserveGoal * 100, 100) : 0;

  var fields = [
    { k: "invest", l: "Inversión mensual" },
    { k: "portfolio", l: "Cartera actual" },
    { k: "target", l: "Objetivo pasivo mensual" },
    { k: "returnRate", l: "Rentabilidad anual %" },
    { k: "swr", l: "Tasa retiro segura %" },
    { k: "appreciation", l: "Revalorización inmuebles %" },
  ];

  function commitF(k) {
    var obj = {};
    obj[k] = parseFloat(tmp) || 0;
    save(Object.assign({}, d, { fire: Object.assign({}, d.fire, obj) }));
    setEd(null);
  }

  return (
    <div style={st.col}>
      <div style={Object.assign({}, st.card, { textAlign: "center", padding: 18 })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db", marginBottom: 10 }}>🔥 Progreso FIRE</div>
        <svg viewBox="0 0 200 120" style={{ width: "100%", maxWidth: 240 }}>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1f2937" strokeWidth="14" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#fg2)" strokeWidth="14" strokeLinecap="round" strokeDasharray={(Math.min(cx.firePct, 1) * 251.2) + " 251.2"} />
          <defs><linearGradient id="fg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f87171" /><stop offset="50%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#4ade80" /></linearGradient></defs>
          <text x="100" y="80" textAnchor="middle" fill="#e5e7eb" fontSize="24" fontWeight="700" fontFamily="monospace">{(cx.firePct * 100).toFixed(1)}%</text>
          <text x="100" y="100" textAnchor="middle" fill="#6b7280" fontSize="10">Meta: {fk(cx.fireNum)}</text>
        </svg>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
          <FsStat v={yToFire} l="años FIRE" />
          <FsStat v={fp(cx.savRate)} l="tasa ahorro" />
          <FsStat v={fm(cx.rentalFCL)} l="FCL inmuebles" c={cx.rentalFCL >= 0 ? "#4ade80" : "#f87171"} />
          <FsStat v={fm(cx.disposable)} l="disponible" c={cx.disposable >= 0 ? "#4ade80" : "#f87171"} />
        </div>
      </div>

      <div style={Object.assign({}, st.card, { background: "#0f1520", border: "1px solid #1e3a5f" })}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#93c5fd", marginBottom: 6 }}>💳 Flujo integrado mensual</div>
        <FRow l="Ingresos Juanma (incl. alquileres)" v={cx.incJuanma} c={cx.incJuanma >= 0 ? "#4ade80" : "#f87171"} />
        <FRow l="Ingresos Amanda" v={cx.incAmanda} c="#34d399" />
        <div style={{ borderTop: "1px solid #1e3a5f", margin: "4px 0" }} />
        <FRow l="Total ingreso hogar" v={cx.bInc} c="#4ade80" bold={true} />
        <FRow l="Gastos personales" v={-cx.bExp} c="#f87171" />
        <FRow l="Inversión" v={-d.fire.invest} c="#60a5fa" />
        <div style={{ borderTop: "2px solid #1e3a5f", margin: "4px 0" }} />
        <FRow l="Sobrante libre" v={cx.disposable - d.fire.invest} c={cx.disposable - d.fire.invest >= 0 ? "#4ade80" : "#f87171"} bold={true} />
      </div>

      <div style={st.card}>
        <div style={st.secT}>Fondo de reserva</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ flex: 1, height: 16, background: "#1f2937", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: resPct + "%", height: "100%", borderRadius: 4, background: resPct >= 80 ? "#22c55e" : resPct >= 40 ? "#eab308" : "#ef4444" }} />
          </div>
          <span style={{ color: "#e5e7eb", fontWeight: 600, fontFamily: "monospace", fontSize: 13 }}>{fm(d.reserve)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginBottom: 6 }}>
          <span>0€</span><span>Meta: {fm(d.reserveGoal)}</span>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[100, 200, 500].map(function (n) {
            return <button key={n} onClick={function () { save(Object.assign({}, d, { reserve: d.reserve + n })); }} style={st.smBtn}>+{n}€</button>;
          })}
          <button onClick={function () { var v = prompt("Nuevo saldo:"); if (v) save(Object.assign({}, d, { reserve: parseFloat(v) })); }} style={Object.assign({}, st.smBtn, { background: "#1f2937" })}>Ajustar</button>
        </div>
      </div>

      <div style={st.card}>
        <div style={st.secT}>Parámetros FIRE</div>
        {fields.map(function (f) {
          return (
            <div key={f.k} style={st.editRow}>
              <span style={{ color: "#9ca3af", fontSize: 12, flex: 1 }}>{f.l}</span>
              {ed === f.k ? (
                <div style={{ display: "flex", gap: 3 }}>
                  <input type="number" value={tmp} onChange={function (e) { setTmp(e.target.value); }}
                    style={Object.assign({}, st.inp, { width: 75 })} autoFocus />
                  <button onClick={function () { commitF(f.k); }} style={st.miniBtn}>✓</button>
                </div>
              ) : (
                <span onClick={function () { setEd(f.k); setTmp(String(d.fire[f.k])); }} style={st.edVal}>
                  {d.fire[f.k].toLocaleString("es-ES")} ✎
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FsStat(p) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: p.c || "#e5e7eb" }}>{p.v}</span>
      <span style={{ fontSize: 9, color: "#6b7280" }}>{p.l}</span>
    </div>
  );
}

function FRow(p) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span style={{ fontSize: 12, color: p.bold ? "#e5e7eb" : "#9ca3af", fontWeight: p.bold ? 600 : 400 }}>{p.l}</span>
      <span style={{ fontFamily: "monospace", fontSize: p.bold ? 14 : 12, color: p.c, fontWeight: p.bold ? 700 : 400 }}>{fm(p.v)}</span>
    </div>
  );
}

/* ===== YEARLY ===== */
function YearTab(p) {
  var d = p.data, cx = p.cx, save = p.save;
  var yrs = d.projYears || 15;
  var tor = d.props[0], zar = d.props[1];
  var fr = d.fire;

  var rows = [];
  var portfolio = fr.portfolio;
  var ar = fr.returnRate / 100;
  var annC = fr.invest * 12;
  var swr = fr.swr / 100;
  var appr = (fr.appreciation || 2) / 100;
  var torV = tor.price || 190000;
  var zarV = zar.price || 0;

  for (var y = 0; y <= yrs; y++) {
    var year = 2026 + y;
    var isY1 = y === 0;
    var tRent = tor.rent * (isY1 ? 11 : 12);
    var zRent = y < 1 ? 0 : (zar.rent > 0 ? zar.rent : 1000) * 12;
    var tMort = (isY1 ? tor.mortM1 : tor.mortM2) * (isY1 ? 11 : 12);
    var tOth = tor.insAnnual + tor.ibi + tor.community * (isY1 ? 11 : 12) + tor.maint * (isY1 ? 11 : 12) + tor.rent * tor.vacancy / 100 * (isY1 ? 11 : 12);
    var zOth = zar.insAnnual + zar.ibi + zar.community * 12 + (y < 1 ? 0 : zar.maint * 12);
    var rFCL = (tRent + zRent) - tMort - tOth - zOth;
    if (y > 0) { portfolio = portfolio * (1 + ar) + annC; torV *= (1 + appr); if (zarV > 0) zarV *= (1 + appr); }
    var invInc = portfolio * swr;
    var nw = portfolio + torV + zarV;
    rows.push({ year: year, rFCL: rFCL, annC: annC, portfolio: portfolio, invInc: invInc, nw: nw, fp: cx.fireNum > 0 ? portfolio / cx.fireNum : 0 });
  }

  var fireYear = rows.find(function (r) { return r.fp >= 1; });

  return (
    <div style={st.col}>
      <div style={Object.assign({}, st.card, { textAlign: "center", background: fireYear ? "#0a1f0a" : "#1a0f0f", border: "1px solid " + (fireYear ? "#166534" : "#7f1d1d") })}>
        {fireYear ? (
          <div>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div style={{ color: "#4ade80", margin: "6px 0 3px", fontSize: 15, fontWeight: 600 }}>FIRE en {fireYear.year}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Patrimonio: {fk(fireYear.nw)} · Cartera: {fk(fireYear.portfolio)}</div>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: 28 }}>🔥</span>
            <div style={{ color: "#fbbf24", margin: "6px 0 3px", fontSize: 15, fontWeight: 600 }}>FIRE no alcanzado en {yrs} años</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Aumenta inversión o ingresos pasivos</div>
          </div>
        )}
      </div>

      <div style={st.card}>
        <div style={st.secT}>Evolución patrimonio</div>
        {rows.filter(function (_, i) { return i % (yrs > 12 ? 2 : 1) === 0 || i === rows.length - 1; }).map(function (r, i) {
          var mx = Math.max.apply(null, rows.map(function (rr) { return rr.nw; }).concat([1]));
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span style={{ width: 32, fontSize: 10, color: r.fp >= 1 ? "#4ade80" : "#6b7280", textAlign: "right", fontWeight: r.fp >= 1 ? 700 : 400 }}>{r.year}</span>
              <div style={{ flex: 1, height: 18, background: "#1a1d24", borderRadius: 4, display: "flex", overflow: "hidden" }}>
                <div style={{ width: (r.portfolio / mx * 100) + "%", height: "100%", background: "#2563eb" }} />
                <div style={{ width: ((r.nw - r.portfolio) / mx * 100) + "%", height: "100%", background: "#0d9488" }} />
              </div>
              <span style={{ fontSize: 10, color: "#9ca3af", minWidth: 44, textAlign: "right", fontFamily: "monospace" }}>{fk(r.nw)}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
          <span style={{ fontSize: 10, color: "#6b7280" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#2563eb", borderRadius: 2, marginRight: 3, verticalAlign: "middle" }} />Cartera</span>
          <span style={{ fontSize: 10, color: "#6b7280" }}><span style={{ display: "inline-block", width: 8, height: 8, background: "#0d9488", borderRadius: 2, marginRight: 3, verticalAlign: "middle" }} />Inmuebles</span>
        </div>
      </div>

      <div style={Object.assign({}, st.card, { overflowX: "auto" })}>
        <div style={st.secT}>Tabla proyección</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #374151" }}>
              {["Año", "Renta FCL", "Inversión", "Cartera", "Rta. inv.", "Patrimonio", "FIRE"].map(function (h) {
                return <th key={h} style={{ padding: "5px 6px", textAlign: "right", color: "#6b7280", fontWeight: 600, fontSize: 10 }}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map(function (r, i) {
              return (
                <tr key={i} style={Object.assign({ borderBottom: "1px solid #1f2937" }, r.fp >= 1 ? { background: "#0a1f0a" } : {})}>
                  <td style={tdc}>{r.year}</td>
                  <td style={Object.assign({}, tdc, { color: r.rFCL >= 0 ? "#4ade80" : "#f87171" })}>{fk(r.rFCL)}</td>
                  <td style={tdc}>{fk(r.annC)}</td>
                  <td style={Object.assign({}, tdc, { color: "#60a5fa" })}>{fk(r.portfolio)}</td>
                  <td style={Object.assign({}, tdc, { color: "#93c5fd" })}>{fk(r.invInc)}</td>
                  <td style={Object.assign({}, tdc, { fontWeight: 600, color: "#e5e7eb" })}>{fk(r.nw)}</td>
                  <td style={tdc}>
                    <span style={{
                      padding: "2px 5px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                      background: r.fp >= 1 ? "#166534" : r.fp >= 0.5 ? "#78350f" : "#1f2937",
                      color: r.fp >= 1 ? "#86efac" : r.fp >= 0.5 ? "#fcd34d" : "#6b7280"
                    }}>{Math.round(r.fp * 100)}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={st.card}>
        <div style={st.secT}>Años de proyección</div>
        <div style={{ display: "flex", gap: 5 }}>
          {[10, 15, 20, 25, 30].map(function (n) {
            return <button key={n} onClick={function () { save(Object.assign({}, d, { projYears: n })); }}
              style={Object.assign({}, st.smBtn, yrs === n ? { background: "#1e3a5f", color: "#93c5fd" } : {})}>{n}</button>;
          })}
        </div>
      </div>
    </div>
  );
}

var tdc = { padding: "6px", textAlign: "right", fontFamily: "monospace", color: "#d1d5db", whiteSpace: "nowrap" };

/* ===== SETTINGS ===== */
function SetTab(p) {
  var d = p.data, save = p.save;
  return (
    <div style={st.col}>
      <div style={st.card}>
        <div style={st.secT}>Modo hipoteca</div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Año 1: 1,95% (~558€) · Año 2+: 2,95% (~634€)</div>
        <div style={{ display: "flex", gap: 5 }}>
          {[1, 2].map(function (n) {
            return <button key={n} onClick={function () { save(Object.assign({}, d, { yearMode: n })); }}
              style={Object.assign({}, st.smBtn, d.yearMode === n ? { background: "#1e3a5f", color: "#93c5fd" } : {})}>Año {n}</button>;
          })}
        </div>
      </div>
      <div style={st.card}>
        <div style={st.secT}>Datos</div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Guardados entre sesiones en este dispositivo.</div>
        <button onClick={function () { if (confirm("¿Resetear todo?")) save(makeDefault()); }}
          style={Object.assign({}, st.smBtn, { background: "#7f1d1d", color: "#fca5a5" })}>Resetear todo</button>
      </div>
      <div style={st.card}>
        <div style={st.secT}>Checklist pendiente</div>
        {["Confirmar IBI Torrejón", "Confirmar comunidad propietarios Torrejón", "Consultar asesor fiscal: vivienda habitual vs alquiler", "Revisar escritura hipoteca (no FEIN)", "Definir fecha inicio ingresos Zarauz", "Obtener escritura constitución hipoteca Ibercaja"].map(function (txt, i) {
          return (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1f2937" }}>
              <span>⬜</span><span style={{ fontSize: 12, color: "#d1d5db" }}>{txt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== SHARED ===== */
function Kpi(p) {
  return (
    <div style={st.kpiCard}>
      <span style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.l}</span>
      <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace", color: p.ok ? "#4ade80" : "#f87171" }}>{p.v}</span>
      <span style={{ fontSize: 10, color: "#4b5563" }}>{p.s}</span>
    </div>
  );
}

function PropMini(p) {
  var ph = PHASES.find(function (x) { return x.id === p.phase; }) || PHASES[0];
  var bw = p.c.income > 0 ? Math.min(p.c.exp / p.c.income * 100, 100) : 0;
  return (
    <div style={st.propC}>
      <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{p.ic}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb" }}>{p.name}</div>
          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 6, fontWeight: 600, background: ph.bg, color: ph.fg }}>
            {ph.label}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: "#9ca3af" }}>Ingreso</span><span style={{ color: "#4ade80" }}>{fm(p.c.income)}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: "#9ca3af" }}>Gastos</span><span style={{ color: "#f87171" }}>{fm(-p.c.exp)}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #2a2d35", paddingTop: 5, marginTop: 5, fontWeight: 700 }}>
        <span style={{ fontSize: 11 }}>FCL</span>
        <span style={{ fontSize: 15, color: p.c.fcl >= 0 ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>{fm(p.c.fcl)}</span>
      </div>
      <div style={{ height: 3, background: "#1f2937", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: bw + "%", height: "100%", borderRadius: 2, background: bw > 95 ? "#f87171" : bw > 80 ? "#fbbf24" : "#4ade80" }} />
      </div>
    </div>
  );
}

function AlertBox(p) {
  var a = p.a;
  var bg = a.t === "crit" ? "#1c0f0f" : a.t === "warn" ? "#1c1a0f" : "#0f1520";
  var bd = a.t === "crit" ? "#7f1d1d" : a.t === "warn" ? "#78350f" : "#1e3a5f";
  var dot = a.t === "crit" ? "🔴" : a.t === "warn" ? "🟡" : "🔵";
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "7px 8px", borderRadius: 8, background: bg, border: "1px solid " + bd, fontSize: 11, marginTop: 4 }}>
      <span>{dot}</span>
      <div>
        <span style={{ fontSize: 9, color: "#9ca3af", display: "block", textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.prop}</span>
        <span style={{ color: "#d1d5db", lineHeight: 1.4 }}>{a.txt}</span>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
var st = {
  app: { minHeight: "100vh", background: "#0f1117", color: "#e5e7eb", fontFamily: "'DM Sans','Helvetica Neue',sans-serif", maxWidth: 640, margin: "0 auto" },
  hdr: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 12px 5px", borderBottom: "1px solid #1a1d24" },
  title: { fontSize: 15, fontWeight: 700, color: "#f3f4f6", letterSpacing: "-0.02em" },
  sub: { fontSize: 9, color: "#6b7280", letterSpacing: "0.03em", textTransform: "uppercase" },
  yrBadge: { fontSize: 10, padding: "3px 8px", borderRadius: 14, background: "#1f2937", color: "#93c5fd", cursor: "pointer", border: "1px solid #374151" },
  nav: { display: "flex", gap: 1, padding: "5px 6px", overflowX: "auto", borderBottom: "1px solid #1a1d24", WebkitOverflowScrolling: "touch" },
  navBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "5px 6px", border: "none", background: "transparent", color: "#6b7280", borderRadius: 7, cursor: "pointer", flex: 1, minWidth: 42 },
  navAct: { background: "#1f2937", color: "#e5e7eb" },
  main: { padding: 10, paddingBottom: 40 },
  card: { background: "#161920", borderRadius: 10, padding: 12, border: "1px solid #1f2937" },
  secT: { fontSize: 13, fontWeight: 600, color: "#d1d5db", marginBottom: 4 },
  blockT: { fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 },
  col: { display: "flex", flexDirection: "column", gap: 10 },
  kpiRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  kpiCard: { background: "#161920", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 1, border: "1px solid #1f2937" },
  propC: { background: "#161920", borderRadius: 10, padding: 10, border: "1px solid #1f2937" },
  editRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 4px", borderBottom: "1px solid #1f2937", gap: 5 },
  edVal: { color: "#93c5fd", fontSize: 12, cursor: "pointer", fontFamily: "monospace", padding: "3px 6px", borderRadius: 6, background: "#1a1d24", whiteSpace: "nowrap" },
  inp: { padding: "5px 7px", borderRadius: 6, border: "1px solid #374151", background: "#0f1117", color: "#e5e7eb", fontSize: 12, fontFamily: "monospace", outline: "none", boxSizing: "border-box" },
  miniBtn: { padding: "3px 8px", borderRadius: 5, border: "none", background: "#166534", color: "#86efac", cursor: "pointer", fontSize: 12 },
  addBtn: { padding: "3px 10px", borderRadius: 7, border: "1px solid #374151", background: "#1f2937", color: "#d1d5db", cursor: "pointer", fontSize: 13, lineHeight: "1.4" },
  smBtn: { padding: "4px 10px", borderRadius: 7, border: "1px solid #374151", background: "#1a1d24", color: "#d1d5db", cursor: "pointer", fontSize: 11 },
};
