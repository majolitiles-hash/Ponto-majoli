import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { C, today, fmtHours, fmtDate, getDow, calcTotal } from "../lib/helpers";

export default function AdminApp({ funcionario, onLogout }) {
  const [tab, setTab] = useState("ponto");
  const [funcionarios, setFuncionarios] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarTudo = async () => {
    setLoading(true);
    const { data: fs } = await supabase.from("funcionarios").select("*").order("nome");
    const { data: rs } = await supabase.from("registros").select("*");
    setFuncionarios(fs || []);
    setRegistros(rs || []);
    setLoading(false);
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.navyLight, fontWeight: 700 }}>A carregar...</div>;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: C.navy, color: C.white, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: C.orange, borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: C.navy }}>MJ</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Ponto Majoli</div>
            <div style={{ fontSize: 11, color: "#9AAAC4" }}>Admin: {funcionario.nome}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[["ponto", "⏱ Ponto"], ["historico", "📋 Histórico"], ["equipa", "👷 Equipa"], ["resumo", "💰 Resumo"]].map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
                fontWeight: tab === k ? 700 : 500,
                background: tab === k ? C.orange : "rgba(255,255,255,0.1)",
                color: tab === k ? C.navy : C.white,
              }}
            >
              {v}
            </button>
          ))}
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.12)", color: C.white, border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </header>

      <main style={{ padding: "20px 16px", maxWidth: 900, margin: "0 auto" }}>
        {tab === "ponto" && <PontoTab funcionarios={funcionarios} registros={registros} reload={carregarTudo} />}
        {tab === "historico" && <HistoricoTab funcionarios={funcionarios} registros={registros} reload={carregarTudo} />}
        {tab === "equipa" && <EquipaTab funcionarios={funcionarios} registros={registros} reload={carregarTudo} />}
        {tab === "resumo" && <ResumoTab funcionarios={funcionarios} registros={registros} />}
      </main>
    </div>
  );
}

function PontoTab({ funcionarios, registros, reload }) {
  const [data, setData] = useState(today());

  const getReg = (fId) => registros.find((r) => r.funcionario_id === fId && r.data === data) || {};

  const setCampo = async (fId, campo, valor) => {
    const existente = getReg(fId);
    const payload = { funcionario_id: fId, data, entrada: existente.entrada, saida_almoco: existente.saida_almoco, volta_almoco: existente.volta_almoco, saida: existente.saida, [campo]: valor };
    await supabase.from("registros").upsert(payload, { onConflict: "funcionario_id,data" });
    reload();
  };

  return (
    <>
      <div style={card}>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.textLight, marginRight: 10 }}>📅 Data:</span>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inputStyle} />
      </div>
      {funcionarios.filter((f) => !f.is_admin).map((f) => {
        const r = getReg(f.id);
        const total = calcTotal(r);
        return (
          <div key={f.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, color: C.navy }}>{f.nome}</div>
              {total > 0 && <span style={tag(C.green)}>{fmtHours(total)}</span>}
            </div>
            
