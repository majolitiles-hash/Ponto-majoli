import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { C, today, nowStr, fmtHours, fmtDate, getDow, calcTotal } from "../lib/helpers";

export default function FuncionarioApp({ funcionario, onLogout }) {
  const [reg, setReg] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    const { data: hoje } = await supabase
      .from("registros")
      .select("*")
      .eq("funcionario_id", funcionario.id)
      .eq("data", today())
      .maybeSingle();
    setReg(hoje || { data: today(), entrada: null, saida_almoco: null, volta_almoco: null, saida: null });

    const { data: ultimos } = await supabase
      .from("registros")
      .select("*")
      .eq("funcionario_id", funcionario.id)
      .order("data", { ascending: false })
      .limit(14);
    setHistorico(ultimos || []);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const bater = async (campo) => {
    const valor = nowStr();
    const payload = { ...reg, [campo]: valor, funcionario_id: funcionario.id, data: today() };
    delete payload.id;
    delete payload.created_at;
    const { data, error } = await supabase
      .from("registros")
      .upsert(payload, { onConflict: "funcionario_id,data" })
      .select()
      .single();
    if (!error) setReg(data);
    carregar();
  };

  if (loading) return <Center>A carregar...</Center>;

  const passos = [
    { field: "entrada", label: "Entrada", icon: "🟢" },
    { field: "saida_almoco", label: "Saída Almoço", icon: "🍽️" },
    { field: "volta_almoco", label: "Volta Almoço", icon: "🔄" },
    { field: "saida", label: "Saída Final", icon: "🔴" },
  ];

  const proximoIndex = passos.findIndex((p) => !reg[p.field]);
  const totalHoje = calcTotal(reg);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          background: C.navy,
          color: C.white,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{funcionario.nome}</div>
          <div style={{ fontSize: 12, color: "#9AAAC4" }}>{funcionario.funcao}</div>
        </div>
        <button
          onClick={onLogout}
          style={{ background: "rgba(255,255,255,0.12)", color: C.white, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
        >
          Sair
        </button>
      </header>

      <main style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: C.white, borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 6px rgba(27,58,107,0.08)" }}>
          <div style={{ fontSize: 12, color: C.textLight, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
            Hoje, {getDow(today())} {fmtDate(today())}
          </div>

          {totalHoje > 0 && (
            <div style={{ background: C.gray, borderRadius: 10, padding: "10px 14px", marginBottom: 16, textAlign: "center" }}>
              <span style={{ fontSize: 13, color: C.textLight }}>Total de hoje: </span>
              <span style={{ fontSize: 16, fontWeight: 900, color: C.navy }}>{fmtHours(totalHoje)}</span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {passos.map((p, i) => {
              const feito = !!reg[p.field];
              const disponivel = i === proximoIndex;
              return (
                <div
                  key={p.field}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: `2px solid ${feito ? C.green : disponivel ? C.orange : C.gray}`,
                    background: feito ? "#F0FDF4" : disponivel ? "#FFFBF0" : C.bg,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{p.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.label}</span>
                  </div>
                  {feito ? (
                    <span style={{ fontWeight: 900, fontSize: 18, color: C.navy }}>{reg[p.field]}</span>
                  ) : disponivel ? (
                    <button
                      onClick={() => bater(p.field)}
                      style={{ background: C.orange, color: C.navy, border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                    >
                      Bater agora
                    </button>
                  ) : (
                    <span style={{ color: C.grayMid, fontSize: 13 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 1px 6px rgba(27,58,107,0.08)" }}>
          <div style={{ fontSize: 12, color: C.textLight, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
            Últimos dias
          </div>
          {historico.length === 0 ? (
            <div style={{ color: C.grayMid, fontSize: 13, textAlign: "center", padding: 20 }}>Ainda sem registos.</div>
          ) : (
            historico.map((r) => {
              const tot = calcTotal(r);
              return (
                <div
                  key={r.id}
                  style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.gray}`, fontSize: 13 }}
                >
                  <span style={{ fontWeight: 700 }}>{getDow(r.data)} {fmtDate(r.data)}</span>
                  <span style={{ fontWeight: 800, color: tot > 0 ? C.green : C.grayMid }}>{tot > 0 ? fmtHours(tot) : "incompleto"}</span>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function Center({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.navyLight, fontWeight: 700, fontFamily: "system-ui" }}>
      {children}
    </div>
  );
}
