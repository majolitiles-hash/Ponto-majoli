import { useState } from "react";
import { supabase } from "../supabaseClient";
import { C } from "../lib/helpers";

export default function Login({ onLogin }) {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    if (pin.length < 4) {
      setErro("O PIN tem 4 dígitos.");
      return;
    }
    setLoading(true);
    setErro("");
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("pin", pin)
      .eq("ativo", true)
      .maybeSingle();

    setLoading(false);
    if (error || !data) {
      setErro("PIN incorreto. Tenta novamente.");
      return;
    }
    localStorage.setItem("ponto_funcionario", JSON.stringify(data));
    onLogin(data);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.navy,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: C.orange,
          borderRadius: 16,
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 24,
          color: C.navy,
          marginBottom: 16,
        }}
      >
        MJ
      </div>
      <h1 style={{ color: C.white, fontSize: 20, marginBottom: 4 }}>Ponto Majoli</h1>
      <p style={{ color: "#9AAAC4", fontSize: 13, marginBottom: 28 }}>Insere o teu PIN para entrar</p>

      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && entrar()}
        placeholder="••••"
        style={{
          width: 160,
          textAlign: "center",
          fontSize: 32,
          letterSpacing: 12,
          padding: "12px 0",
          borderRadius: 12,
          border: "none",
          outline: "none",
          marginBottom: 16,
          fontWeight: 800,
          color: C.navy,
        }}
        autoFocus
      />

      {erro && <div style={{ color: "#FCA5A5", fontSize: 13, marginBottom: 12 }}>{erro}</div>}

      <button
        onClick={entrar}
        disabled={loading}
        style={{
          background: C.orange,
          color: C.navy,
          border: "none",
          borderRadius: 10,
          padding: "12px 40px",
          fontWeight: 800,
          fontSize: 15,
          cursor: "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "A entrar..." : "Entrar"}
      </button>

      <p style={{ color: "#5B6B8C", fontSize: 11, marginTop: 32, textAlign: "center" }}>
        Esqueceste o PIN? Fala com o Matheus.
      </p>
    </div>
  );
}
