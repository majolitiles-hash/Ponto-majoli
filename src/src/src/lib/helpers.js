export const today = () => new Date().toISOString().slice(0, 10);

export const nowStr = () => new Date().toTimeString().slice(0, 5);

export const parseTime = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const diffMin = (a, b) => {
  const pa = parseTime(a),
    pb = parseTime(b);
  if (pa == null || pb == null) return 0;
  return Math.max(0, pb - pa);
};

export const fmtHours = (min) => {
  if (!min || min <= 0) return "0h 00m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

// r = { entrada, saida_almoco, volta_almoco, saida }
export const calcTotal = (r) => {
  let total = 0;
  const manha = diffMin(r.entrada, r.saida_almoco);
  const tarde = diffMin(r.volta_almoco, r.saida);
  const semAlmoco = diffMin(r.entrada, r.saida);
  if (r.saida_almoco && r.volta_almoco) {
    total = manha + tarde;
  } else if (!r.saida_almoco && !r.volta_almoco && r.saida) {
    total = semAlmoco;
  } else if (r.saida_almoco && !r.volta_almoco) {
    total = manha;
  } else if (!r.saida_almoco && r.volta_almoco) {
    total = tarde;
  }
  return total;
};

export const fmtDate = (d) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const getDow = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return weekdays[new Date(y, m - 1, d).getDay()];
};

// Cores da Majoli, usadas em todo o app
export const C = {
  navy: "#1B3A6B",
  navyLight: "#2A5298",
  navyDark: "#122748",
  orange: "#F5A623",
  bg: "#F4F6FB",
  white: "#FFFFFF",
  gray: "#E8ECF4",
  grayMid: "#9AAAC4",
  text: "#1A2340",
  textLight: "#4A5878",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#F59E0B",
};
