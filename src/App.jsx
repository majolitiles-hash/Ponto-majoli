import { useState, useEffect } from "react";
import Login from "./components/Login";
import AdminApp from "./components/AdminApp";
import FuncionarioApp from "./components/FuncionarioApp";

export default function App() {
  const [funcionario, setFuncionario] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ponto_funcionario");
    if (saved) {
      try {
        setFuncionario(JSON.parse(saved));
      } catch {}
    }
    setChecked(true);
  }, []);

  const onLogout = () => {
    localStorage.removeItem("ponto_funcionario");
    setFuncionario(null);
  };

  if (!checked) return null;
  if (!funcionario) return <Login onLogin={setFuncionario} />;

  return funcionario.is_admin ? (
    <AdminApp funcionario={funcionario} onLogout={onLogout} />
  ) : (
    <FuncionarioApp funcionario={funcionario} onLogout={onLogout} />
  );
}
