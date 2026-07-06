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

// ── Visão geral do dia (admin pode corrigir qualquer funcionário) ──
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[["entrada", "Entrada"], ["saida_almoco", "Saída Alm."], ["volta_almoco", "Volta Alm."], ["saida", "Saída"]].map(([campo, label]) => (
                <div key={campo}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textLight, marginBottom: 4 }}>{label}</div>
                  <input type="time" value={r[campo] || ""} onChange={(e) => setCampo(f.id, campo, e.target.value || null)} style={{ ...inputStyle, width: "100%", fontSize: 12, padding: "6px 6px" }} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Histórico completo com filtros ──
function HistoricoTab({ funcionarios, registros, reload }) {
  const [filtroFunc, setFiltroFunc] = useState("todos");
  const [mes, setMes] = useState(today().slice(0, 7));

  const linhas = registros
    .filter((r) => r.data.startsWith(mes) && (filtroFunc === "todos" || r.funcionario_id === filtroFunc))
    .sort((a, b) => b.data.localeCompare(a.data));

  const apagar = async (id) => {
    if (!confirm("Apagar este registo?")) return;
    await supabase.from("registros").delete().eq("id", id);
    reload();
  };

  const nomeDe = (id) => funcionarios.find((f) => f.id === id)?.nome || "—";

  return (
    <>
      <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select value={filtroFunc} onChange={(e) => setFiltroFunc(e.target.value)} style={inputStyle}>
          <option value="todos">Todos</option>
          {funcionarios.filter((f) => !f.is_admin).map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={inputStyle} />
      </div>
      <div style={card}>
        {linhas.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grayMid, padding: 20 }}>Nenhum registo.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.gray}` }}>
                  {["Data", "Funcionário", "Entrada", "S.Almoço", "V.Almoço", "Saída", "Total", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: 8, fontSize: 11, color: C.textLight, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((r) => {
                  const tot = calcTotal(r);
                  return (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${C.gray}` }}>
                      <td style={{ padding: 8, fontWeight: 700 }}>{getDow(r.data)} {fmtDate(r.data)}</td>
                      <td style={{ padding: 8 }}>{nomeDe(r.funcionario_id)}</td>
                      <td style={{ padding: 8 }}>{r.entrada || "—"}</td>
                      <td style={{ padding: 8 }}>{r.saida_almoco || "—"}</td>
                      <td style={{ padding: 8 }}>{r.volta_almoco || "—"}</td>
                      <td style={{ padding: 8 }}>{r.saida || "—"}</td>
                      <td style={{ padding: 8 }}><span style={tag(tot > 0 ? C.green : C.grayMid)}>{tot > 0 ? fmtHours(tot) : "—"}</span></td>
                      <td style={{ padding: 8 }}><button onClick={() => apagar(r.id)} style={{ ...btnSm(C.red + "15", C.red) }}>🗑</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── Gestão de funcionários ──
function EquipaTab({ funcionarios, registros, reload }) {
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("Ladrilhador");
  const [valor, setValor] = useState("");
  const [pin, setPin] = useState("");
  const [editId, setEditId] = useState(null);
  const [erro, setErro] = useState("");

  const limpar = () => { setNome(""); setFuncao("Ladrilhador"); setValor(""); setPin(""); setEditId(null); setErro(""); };

  const salvar = async () => {
    if (!nome.trim() || pin.length !== 4) { setErro("Preenche nome e PIN de 4 dígitos."); return; }
    setErro("");
    if (editId) {
      await supabase.from("funcionarios").update({ nome, funcao, valor_hora: valor || null, pin }).eq("id", editId);
    } else {
      const { error } = await supabase.from("funcionarios").insert({ nome, funcao, valor_hora: valor || null, pin });
      if (error) { setErro(error.message.includes("duplicate") ? "Esse PIN já está em uso." : error.message); return; }
    }
    limpar();
    reload();
  };

  const remover = async (id) => {
    if (!confirm("Remover funcionário? Os registos de ponto dele serão mantidos.")) return;
    await supabase.from("funcionarios").update({ ativo: false }).eq("id", id);
    reload();
  };

  const editar = (f) => { setEditId(f.id); setNome(f.nome); setFuncao(f.funcao || ""); setValor(f.valor_hora || ""); setPin(f.pin); };

  return (
    <>
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.navyLight, marginBottom: 12, textTransform: "uppercase" }}>
          {editId ? "Editar funcionário" : "Adicionar funcionário"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
          <div><div style={labelStyle}>Nome</div><input style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><div style={labelStyle}>Função</div>
            <select style={inputStyle} value={funcao} onChange={(e) => setFuncao(e.target.value)}>
              {["Ladrilhador", "Servente", "Encarregado", "Subcontratado", "Outro"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><div style={labelStyle}>€/hora</div><input style={inputStyle} type="number" step="0.5" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
          <div><div style={labelStyle}>PIN (4 díg.)</div><input style={inputStyle} maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} /></div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={salvar} style={btn(C.orange, C.navy)}>{editId ? "Salvar" : "Adicionar"}</button>
            {editId && <button onClick={limpar} style={btn(C.gray, C.textLight)}>Cancelar</button>}
          </div>
        </div>
        {erro && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{erro}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {funcionarios.filter((f) => !f.is_admin).map((f) => {
          const regsDoFunc = registros.filter((r) => r.funcionario_id === f.id);
          const horas = regsDoFunc.reduce((a, r) => a + calcTotal(r), 0);
          return (
            <div key={f.id} style={{ ...card, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, color: C.navy }}>{f.nome}</div>
                  <div style={{ fontSize: 12, color: C.textLight }}>{f.funcao} · PIN {f.pin}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => editar(f)} style={btnSm(C.navyLight + "15", C.navyLight)}>✏️</button>
                  <button onClick={() => remover(f.id)} style={btnSm(C.red + "15", C.red)}>🗑</button>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 800, color: C.navy }}>{fmtHours(horas)}</span>
                <span style={{ color: C.textLight }}> acumuladas · {f.valor_hora ? `€${f.valor_hora}/h` : "sem valor definido"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Resumo mensal para pagamento ──
function ResumoTab({ funcionarios, registros }) {
  const [mes, setMes] = useState(today().slice(0, 7));

  const resumo = funcionarios.filter((f) => !f.is_admin).map((f) => {
    const regs = registros.filter((r) => r.funcionario_id === f.id && r.data.startsWith(mes));
    const totalMin = regs.reduce((a, r) => a + calcTotal(r), 0);
    const valorTotal = f.valor_hora ? ((totalMin / 60) * f.valor_hora).toFixed(2) : null;
    return { f, regs, totalMin, valorTotal, dias: regs.filter((r) => r.entrada).length };
  });

  const totalGeral = resumo.reduce((a, r) => a + (r.valorTotal ? parseFloat(r.valorTotal) : 0), 0);

  return (
    <>
      <div style={card}>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.textLight, marginRight: 10 }}>📅 Mês:</span>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <StatCard label="Funcionários" val={resumo.length} color={C.navyLight} icon="👷" />
        <StatCard label="Total de horas" val={fmtHours(resumo.reduce((a, r) => a + r.totalMin, 0))} color={C.green} icon="⏱" />
        <StatCard label="Total a pagar" val={`€${totalGeral.toFixed(2)}`} color={C.orange} icon="💰" />
      </div>

      {resumo.map(({ f, regs, totalMin, valorTotal, dias }) => (
        <div key={f.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, color: C.navy }}>{f.nome}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>{f.funcao} · {f.valor_hora ? `€${f.valor_hora}/h` : "valor não definido"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.orange }}>{valorTotal ? `€${valorTotal}` : "—"}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{fmtHours(totalMin)} · {dias} dias</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function StatCard({ label, val, color, icon }) {
  return (
    <div style={{ ...card, marginBottom: 0, textAlign: "center" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{val}</div>
    </div>
  );
}

// estilos compartilhados
const card = { background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 6px rgba(27,58,107,0.08)" };
const inputStyle = { border: `1.5px solid ${C.gray}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none" };
const labelStyle = { fontSize: 10, fontWeight: 700, color: C.textLight, marginBottom: 4, textTransform: "uppercase" };
const tag = (color) => ({ background: color + "22", color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 });
const btn = (bg, color) => ({ background: bg, color, border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" });
const btnSm = (bg, color) => ({ background: bg, color, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" });
