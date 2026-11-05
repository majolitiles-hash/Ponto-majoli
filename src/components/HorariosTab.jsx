import { useState } from "react";
import { supabase } from "../supabaseClient";
import { C, fmtHours, calcTotal, DIAS_SEMANA, hhmm, resumoHorario } from "../lib/helpers";
import { card, inputStyle, labelStyle, tag, btn, btnSm } from "./AdminApp";

const CAMPOS = [
  ["entrada", "Entrada"],
  ["saida_almoco", "Saída Alm."],
  ["volta_almoco", "Volta Alm."],
  ["saida", "Saída"],
];

// Horário padrão sugerido ao criar um quadro novo
const PADRAO = { entrada: "08:00", saida_almoco: "12:00", volta_almoco: "13:00", saida: "17:00" };
const novoDia = (dia) =>
  dia >= 1 && dia <= 5
    ? { dia_semana: dia, folga: false, ...PADRAO }
    : { dia_semana: dia, folga: true, entrada: "", saida_almoco: "", volta_almoco: "", saida: "" };

const minutosDia = (h) => (!h || h.folga ? 0 : calcTotal(h));
const minutosSemana = (lista) => lista.reduce((a, h) => a + minutosDia(h), 0);

export default function HorariosTab({ funcionarios, horarios, horariosErro, reload }) {
  const [editId, setEditId] = useState(null);
  const ativos = funcionarios.filter((f) => !f.is_admin && f.ativo !== false);

  if (horariosErro) {
    return (
      <div style={{ ...card, borderLeft: `4px solid ${C.red}` }}>
        <div style={{ fontWeight: 800, color: C.navy, marginBottom: 6 }}>Falta criar a tabela de horários</div>
        <div style={{ fontSize: 13, color: C.textLight, lineHeight: 1.5 }}>
          No Supabase, abre o <b>SQL Editor</b>, cola o conteúdo do ficheiro <code>supabase-horarios.sql</code> e clica <b>Run</b>. Depois recarrega esta página.
        </div>
      </div>
    );
  }

  const doFunc = (fId) => horarios.filter((h) => h.funcionario_id === fId);
  const editando = ativos.find((f) => f.id === editId);

  return (
    <>
      {editando && (
        <EditorHorario
          key={editando.id}
          funcionario={editando}
          existentes={doFunc(editando.id)}
          funcionarios={ativos}
          onClose={() => setEditId(null)}
          reload={reload}
        />
      )}

      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.navyLight, marginBottom: 12, textTransform: "uppercase" }}>
          🗓 Quadro de horários semanal
        </div>
        {ativos.length === 0 ? (
          <div style={{ textAlign: "center", color: C.grayMid, padding: 20 }}>Cadastra funcionários na aba Equipa primeiro.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.gray}` }}>
                  <th style={th}>Funcionário</th>
                  {DIAS_SEMANA.map((d) => (
                    <th key={d.dia} style={{ ...th, textAlign: "center" }}>{d.curto}</th>
                  ))}
                  <th style={{ ...th, textAlign: "right" }}>Semana</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {ativos.map((f) => {
                  const lista = doFunc(f.id);
                  return (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${C.gray}`, background: f.id === editId ? "#FFFBF0" : undefined }}>
                      <td style={{ padding: 8 }}>
                        <div style={{ fontWeight: 800, color: C.navy }}>{f.nome}</div>
                        <div style={{ fontSize: 11, color: C.textLight }}>{f.funcao}</div>
                      </td>
                      {DIAS_SEMANA.map((d) => {
                        const h = lista.find((x) => x.dia_semana === d.dia);
                        const txt = resumoHorario(h);
                        return (
                          <td key={d.dia} style={{ padding: 6, textAlign: "center", whiteSpace: "nowrap" }}>
                            {txt === "Folga" ? (
                              <span style={tag(C.grayMid)}>Folga</span>
                            ) : txt ? (
                              <span style={{ fontWeight: 700, color: C.text }}>{txt}</span>
                            ) : (
                              <span style={{ color: C.grayMid }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: 8, textAlign: "right", fontWeight: 800, color: C.navy, whiteSpace: "nowrap" }}>
                        {lista.length ? fmtHours(minutosSemana(lista)) : "—"}
                      </td>
                      <td style={{ padding: 8, textAlign: "right" }}>
                        <button onClick={() => setEditId(f.id)} style={btnSm(C.navyLight + "15", C.navyLight)}>
                          {lista.length ? "✏️ Editar" : "＋ Definir"}
                        </button>
                      </td>
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

function EditorHorario({ funcionario, existentes, funcionarios, onClose, reload }) {
  const [dias, setDias] = useState(() =>
    DIAS_SEMANA.map(({ dia }) => {
      const h = existentes.find((x) => x.dia_semana === dia);
      if (!h) return novoDia(dia);
      return {
        dia_semana: dia,
        folga: !!h.folga,
        entrada: hhmm(h.entrada),
        saida_almoco: hhmm(h.saida_almoco),
        volta_almoco: hhmm(h.volta_almoco),
        saida: hhmm(h.saida),
      };
    })
  );
  const [aplicarA, setAplicarA] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const setDia = (i, campo, valor) => setDias((ds) => ds.map((d, j) => (j === i ? { ...d, [campo]: valor } : d)));

  const copiarSegunda = () => {
    const seg = dias[0];
    setDias((ds) => ds.map((d, i) => (i >= 1 && i <= 4 ? { ...seg, dia_semana: d.dia_semana } : d)));
  };

  const validar = () => {
    for (let i = 0; i < dias.length; i++) {
      const d = dias[i];
      if (d.folga) continue;
      const nome = DIAS_SEMANA[i].nome;
      if (!d.entrada || !d.saida) return `${nome}: preenche entrada e saída (ou marca folga).`;
      if (!!d.saida_almoco !== !!d.volta_almoco) return `${nome}: preenche saída E volta do almoço, ou deixa ambos vazios.`;
      const seq = [d.entrada, d.saida_almoco, d.volta_almoco, d.saida].filter(Boolean);
      for (let k = 1; k < seq.length; k++) {
        if (seq[k] <= seq[k - 1]) return `${nome}: os horários têm de estar em ordem crescente.`;
      }
    }
    return "";
  };

  const salvar = async () => {
    const msg = validar();
    if (msg) { setErro(msg); return; }
    setErro("");
    setSalvando(true);
    const alvos = [funcionario.id, ...aplicarA];
    const linhas = alvos.flatMap((fId) =>
      dias.map((d) => ({
        funcionario_id: fId,
        dia_semana: d.dia_semana,
        folga: d.folga,
        entrada: d.folga ? null : d.entrada || null,
        saida_almoco: d.folga ? null : d.saida_almoco || null,
        volta_almoco: d.folga ? null : d.volta_almoco || null,
        saida: d.folga ? null : d.saida || null,
      }))
    );
    const { error } = await supabase.from("horarios").upsert(linhas, { onConflict: "funcionario_id,dia_semana" });
    setSalvando(false);
    if (error) { setErro(error.message); return; }
    await reload();
    onClose();
  };

  const outros = funcionarios.filter((f) => f.id !== funcionario.id);

  return (
    <div style={{ ...card, border: `2px solid ${C.orange}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, color: C.navy }}>Horário de {funcionario.nome}</div>
          <div style={{ fontSize: 12, color: C.textLight }}>Total previsto: {fmtHours(minutosSemana(dias))} por semana</div>
        </div>
        <button onClick={copiarSegunda} style={btnSm(C.navyLight + "15", C.navyLight)}>⇣ Copiar Segunda para Ter–Sex</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.gray}` }}>
              <th style={th}>Dia</th>
              <th style={{ ...th, textAlign: "center" }}>Folga</th>
              {CAMPOS.map(([, l]) => <th key={l} style={th}>{l}</th>)}
              <th style={{ ...th, textAlign: "right" }}>Horas</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d, i) => (
              <tr key={d.dia_semana} style={{ borderBottom: `1px solid ${C.gray}`, opacity: d.folga ? 0.6 : 1 }}>
                <td style={{ padding: 6, fontWeight: 700 }}>{DIAS_SEMANA[i].nome}</td>
                <td style={{ padding: 6, textAlign: "center" }}>
                  <input type="checkbox" checked={d.folga} onChange={(e) => setDia(i, "folga", e.target.checked)} style={{ width: 18, height: 18 }} />
                </td>
                {CAMPOS.map(([campo]) => (
                  <td key={campo} style={{ padding: 4 }}>
                    <input
                      type="time"
                      disabled={d.folga}
                      value={d.folga ? "" : d[campo]}
                      onChange={(e) => setDia(i, campo, e.target.value)}
                      style={{ ...inputStyle, width: "100%", fontSize: 12, padding: "6px" }}
                    />
                  </td>
                ))}
                <td style={{ padding: 6, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {d.folga ? "—" : fmtHours(minutosDia(d))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {outros.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={labelStyle}>Aplicar este mesmo horário também a:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {outros.map((f) => {
              const on = aplicarA.includes(f.id);
              return (
                <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 10px", borderRadius: 20, cursor: "pointer", background: on ? C.orange + "33" : C.gray }}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setAplicarA((a) => (e.target.checked ? [...a, f.id] : a.filter((x) => x !== f.id)))}
                  />
                  {f.nome}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {erro && <div style={{ color: C.red, fontSize: 12, marginTop: 10 }}>{erro}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={salvar} disabled={salvando} style={{ ...btn(C.orange, C.navy), opacity: salvando ? 0.7 : 1 }}>
          {salvando ? "A guardar..." : "Guardar horário"}
        </button>
        <button onClick={onClose} style={btn(C.gray, C.textLight)}>Cancelar</button>
      </div>
    </div>
  );
}

const th = { textAlign: "left", padding: 8, fontSize: 11, color: C.textLight, textTransform: "uppercase" };
