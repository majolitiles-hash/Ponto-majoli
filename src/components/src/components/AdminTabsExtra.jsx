import { useState } from "react";
import { supabase } from "../supabaseClient";
import { C, today, fmtHours, calcTotal } from "../lib/helpers";
import { card, inputStyle, labelStyle, tag, btn, btnSm } from "./AdminApp";

export function EquipaTab({ funcionarios, registros, reload }) {
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

export function ResumoTab({ funcionarios, registros }) {
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
