import React, { useEffect, useMemo, useRef, useState } from "react";

// ─── Konstanten ───────────────────────────────────────────────────────────────

const DEFAULT_RESPONSE = "open";
const CAPTAIN_PIN = "1907";

const CAPTAIN_OPTIONS = [
  { id: "captain-henning", label: "Capitano Henning" },
  { id: "captain-malte", label: "Capitano Malte" },
];

const TEAMS = [
  {
    id: "h30", number: 30, name: "30er Herren", captain: "Henning Isleif",
    league: "Herren 30 · 2. Regionsklasse Gr. 380",
    matches: [
      { id: "h30-1", date: "2026-05-03", time: "10:00", venue: "home", opponent: "TV Pattensen" },
      { id: "h30-2", date: "2026-05-30", time: "14:00", venue: "home", opponent: "TG Hannover V" },
      { id: "h30-3", date: "2026-06-13", time: "14:00", venue: "home", opponent: "SG 1874 Hannover" },
      { id: "h30-4", date: "2026-06-20", time: "10:00", venue: "away", opponent: "HTV Hannover" },
      { id: "h30-5", date: "2026-08-16", time: "",      venue: "away", opponent: "Mühlenberger SV Hannover" },
    ],
    starters: [
      { name: "Valeriano Wolper",  lk: 15.8 },
      { name: "Jonas Lindemann",   lk: 17.5 },
      { name: "Markus Wojcik",     lk: 18.7 },
      { name: "Henning Isleif",    lk: 19.4, captain: true },
      { name: "Christian Schmidt", lk: 20.8 },
      { name: "Thomas Bothor",     lk: 22.5 },
      { name: "Malte Mackenrodt",  lk: 23.4 },
      { name: "Dennis Kollofrath", lk: 23.9 },
    ],
    reserves: [
      { name: "Christian Bruns",  lk: 14.3 },
      { name: "Patrick Smith",    lk: 15.9 },
      { name: "Ura Orojian",      lk: 23.1 },
      { name: "Jörn Nikisch",     lk: 25.0 },
      { name: "Dennis Maring",    lk: 25.0 },
      { name: "Martin Klohde",    lk: 25.0 },
      { name: "Hendrik Hausmann", lk: 25.0 },
    ],
  },
  {
    id: "h40", number: 40, name: "40er Herren", captain: "Malte Mackenrodt",
    league: "Herren 40 · 2. Regionsklasse Gr. 472",
    matches: [
      { id: "h40-1", date: "2026-05-09", time: "14:00", venue: "home", opponent: "TSV Anderten Hannover II" },
      { id: "h40-2", date: "2026-06-14", time: "11:30", venue: "away", opponent: "SG 1874 Hannover II" },
      { id: "h40-3", date: "2026-06-21", time: "10:00", venue: "home", opponent: "TuS Davenstedt II" },
      { id: "h40-4", date: "2026-08-16", time: "10:00", venue: "away", opponent: "VfL Eintracht Hannover II" },
      { id: "h40-5", date: "2026-08-30", time: "10:00", venue: "home", opponent: "DSV 1878 Hannover" },
      { id: "h40-6", date: "2026-09-06", time: "10:00", venue: "away", opponent: "TV Pattensen II" },
    ],
    starters: [
      { name: "Valeriano Wolper",    lk: 15.8 },
      { name: "Jonas Lindemann",     lk: 17.5 },
      { name: "Markus Wojcik",       lk: 18.7 },
      { name: "Henning Isleif",      lk: 19.4 },
      { name: "Malte Mackenrodt",    lk: 23.4, captain: true },
      { name: "Resit Bekfilavioglu", lk: 23.9 },
      { name: "Jörn Nikisch",        lk: 25.0 },
    ],
    reserves: [
      { name: "Olaf Stach",        lk: 13.9 },
      { name: "Mehmet Asci",       lk: 14.4 },
      { name: "Christian Stieg",   lk: 18.5 },
      { name: "Phuoc Dat Luu",     lk: 21.1 },
      { name: "Hoang Phong Tran",  lk: 21.9 },
      { name: "Ura Orojian",       lk: 23.1 },
      { name: "Mario Gangale",     lk: 23.9 },
      { name: "Van Loc Nguyen",    lk: 24.7 },
      { name: "Tobias Schirmer",   lk: 25.0 },
      { name: "Dennis Maring",     lk: 25.0 },
      { name: "Uwe Rosin",         lk: 25.0 },
    ],
  },
];

// Einmalig beim Modulload berechnet – kein useMemo nötig
const ALL_PLAYERS = (() => {
  const map = new Map();
  TEAMS.forEach((team) => {
    [...team.starters, ...team.reserves].forEach((p) => {
      const ex = map.get(p.name);
      if (!ex) {
        map.set(p.name, { name: p.name, lk: p.lk, teams: [team.id] });
      } else {
        ex.lk = Math.min(ex.lk, p.lk);
        if (!ex.teams.includes(team.id)) ex.teams.push(team.id);
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "de"));
})();

// Canvas-Farben einmalig definiert
const C = {
  purple:      "#4c1d95",
  purpleDark:  "#2e1065",
  purpleLight: "#ede9fe",
  gold:        "#facc15",
  white:       "#ffffff",
  zinc900:     "#18181b",
  zinc500:     "#71717a",
  zinc100:     "#f4f4f5",
  emerald:     "#059669",
  red:         "#dc2626",
};

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", {
    weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatMonth(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", {
    month: "long", year: "numeric",
  });
}

function sortByDate(matches) {
  return [...matches].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );
}

function buildInitialResponses() {
  const state = {};
  TEAMS.forEach((team) => {
    team.matches.forEach((match) => {
      state[match.id] = {};
      [...team.starters, ...team.reserves].forEach((p) => {
        state[match.id][p.name] = DEFAULT_RESPONSE;
      });
    });
  });
  return state;
}

function createEmptyLineup() {
  return { singles: ["", "", "", ""], doubles: ["", "", "", ""], bench: ["", "", "", ""] };
}

function normalizeLineup(input) {
  const src = input || {};
  return {
    singles: [0, 1, 2, 3].map((i) => src.singles?.[i] || ""),
    doubles: [0, 1, 2, 3].map((i) => src.doubles?.[i] || ""),
    bench:   [0, 1, 2, 3].map((i) => src.bench?.[i]   || ""),
  };
}

function buildInitialLineups() {
  const state = {};
  TEAMS.forEach((team) => {
    team.matches.forEach((match) => {
      state[match.id] = createEmptyLineup();
    });
  });
  return state;
}

function getCounts(matchId, responses) {
  const values = Object.values(responses[matchId] || {});
  return {
    both:           values.filter((v) => v === "available-both").length,
    singles:        values.filter((v) => v === "available-singles").length,
    doubles:        values.filter((v) => v === "available-doubles").length,
    unavailable:    values.filter((v) => v === "unavailable").length,
    totalAvailable: values.filter((v) => v?.startsWith("available")).length,
  };
}

function getTrafficLight(total) {
  if (total >= 8) return { label: "Komplett",   dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" };
  if (total >= 4) return { label: "Spielfähig", dot: "bg-amber-400",   bg: "bg-amber-50",   text: "text-amber-700"   };
  return               { label: "Zu wenig",    dot: "bg-red-500",     bg: "bg-red-50",     text: "text-red-700"     };
}

function uniqueByName(players) {
  const seen = new Set();
  return players.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

function buildRecommendation(team, matchId, responses) {
  const pool = uniqueByName(
    [...team.starters, ...team.reserves]
      .map((p) => ({
        ...p,
        response:  responses[matchId]?.[p.name] || DEFAULT_RESPONSE,
        squadType: team.starters.some((s) => s.name === p.name) ? "Stamm" : "Reserve",
      }))
      .filter((p) => p.response !== "unavailable" && p.response !== "open")
      .sort((a, b) => a.lk - b.lk)
  );

  const singles = pool.slice(0, 4);
  const doubles = [];
  const pref = pool.filter((p) => p.response === "available-doubles" || p.response === "available-both");

  for (const p of pref) {
    if (doubles.length === 4) break;
    if (!singles.some((s) => s.name === p.name)) doubles.push(p);
  }
  for (const p of pool) {
    if (doubles.length === 4) break;
    if (!doubles.some((d) => d.name === p.name) && !singles.some((s) => s.name === p.name)) doubles.push(p);
  }

  const bench = pool.filter((p) => ![...singles, ...doubles].some((s) => s.name === p.name));
  const sd = [...doubles].sort((a, b) => a.lk - b.lk);

  return {
    singles,
    doubles,
    bench,
    doublePairs:     sd.length >= 4 ? [[sd[0], sd[3]], [sd[1], sd[2]]] : [],
    totalSelected:   singles.length + doubles.length,
    captainIncluded: [...singles, ...doubles].some((p) => p.captain),
    complete:        singles.length === 4 && doubles.length === 4,
  };
}

function lkStr(lk) {
  return String(lk).replace(".", ",");
}

function responseLabel(value) {
  if (value === "available-both")    return "Beides";
  if (value === "available-singles") return "Einzel";
  if (value === "available-doubles") return "Doppel";
  if (value === "unavailable")       return "Nicht dabei";
  return "Offen";
}

function getTeamRosterForMatch(team, matchId, responses) {
  return uniqueByName(
    [...team.starters, ...team.reserves]
      .map((p) => ({
        ...p,
        response:  responses[matchId]?.[p.name] || DEFAULT_RESPONSE,
        squadType: team.starters.some((s) => s.name === p.name) ? "Stamm" : "Reserve",
      }))
      .sort((a, b) => a.lk - b.lk)
  );
}

function getLineupSelectOptions(players, lineup, currentValue) {
  const used = new Set(
    [...lineup.singles, ...lineup.doubles, ...lineup.bench].filter((n) => n && n !== currentValue)
  );
  return players.filter((p) => !used.has(p.name));
}

function getLineupCompletionCount(lineup) {
  return [...lineup.singles, ...lineup.doubles].filter(Boolean).length;
}

function slugifyFilePart(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchJsonSafe(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return res.json();
}

// ─── Canvas Export ────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y,      x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x,     y + height, r);
  ctx.arcTo(x,         y + height, x,     y,           r);
  ctx.arcTo(x,         y,          x + width, y,       r);
  ctx.closePath();
}

function drawPlayerColumn(ctx, { x, y, width, title, accent, labels, values, fallback }) {
  ctx.fillStyle = accent;
  roundRect(ctx, x, y, width, 70, 22);
  ctx.fill();

  ctx.fillStyle = C.white;
  ctx.font = "700 28px Arial";
  ctx.fillText(title, x + 24, y + 44);

  const startY = y + 92;
  const rowHeight = 86;

  labels.forEach((label, idx) => {
    const rowY = startY + idx * rowHeight;
    const name = values[idx] || fallback;

    ctx.fillStyle = C.zinc100;
    roundRect(ctx, x, rowY, width, 68, 20);
    ctx.fill();

    ctx.fillStyle = accent;
    roundRect(ctx, x + 14, rowY + 12, 58, 44, 14);
    ctx.fill();

    ctx.fillStyle = C.white;
    ctx.font = "700 22px Arial";
    const lw = ctx.measureText(label).width;
    ctx.fillText(label, x + 43 - lw / 2, rowY + 40);

    ctx.fillStyle = C.zinc900;
    ctx.font = "700 26px Arial";
    ctx.fillText(name.length > 22 ? `${name.slice(0, 19)}…` : name, x + 92, rowY + 42);
  });
}

function drawBenchSection(ctx, { x, y, width, title, values }) {
  ctx.fillStyle = C.zinc100;
  roundRect(ctx, x, y, width, 115, 24);
  ctx.fill();

  ctx.fillStyle = C.gold;
  roundRect(ctx, x + 20, y + 18, 210, 38, 14);
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.font = "700 20px Arial";
  ctx.fillText(title, x + 36, y + 44);

  ctx.fillStyle = C.zinc900;
  ctx.font = "700 24px Arial";
  const text = values.length > 0 ? values.join(" • ") : "Keine Ersatzspieler festgelegt";
  ctx.fillText(text.length > 72 ? `${text.slice(0, 69)}…` : text, x + 24, y + 88);

  ctx.fillStyle = C.zinc500;
  ctx.font = "500 16px Arial";
  ctx.fillText("WhatsApp-optimiertes Hochformat", x + width - 250, y + 44);
}

function exportLineupAsJpg({ match, team, lineup }) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1080;
  canvas.height = 1350;

  const { width, height } = canvas;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#3b0764");
  bg.addColorStop(0.45, C.purple);
  bg.addColorStop(1, "#5b21b6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.14;
  ctx.fillStyle = C.white;
  ctx.beginPath(); ctx.arc(980, 170, 180, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(120, 1180, 220, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = C.white;
  roundRect(ctx, 52, 52, width - 104, height - 104, 38);
  ctx.fill();

  const headerGrad = ctx.createLinearGradient(0, 52, width, 260);
  headerGrad.addColorStop(0, C.purpleDark);
  headerGrad.addColorStop(1, C.purple);
  ctx.fillStyle = headerGrad;
  roundRect(ctx, 52, 52, width - 104, 250, 38);
  ctx.fill();

  ctx.fillStyle = C.gold;
  roundRect(ctx, 82, 84, 170, 54, 18);
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.font = "700 24px Arial";
  ctx.fillText("LINDEN 07", 111, 118);

  ctx.fillStyle = C.white;
  ctx.font = "700 54px Arial";
  ctx.fillText("MATCHDAY",    82, 192);
  ctx.fillText("AUFSTELLUNG", 82, 250);

  ctx.fillStyle = C.gold;
  ctx.beginPath(); ctx.arc(890, 177, 72, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.font = "700 42px Arial";
  const teamNumber = String(team.number || "");
  ctx.fillText(teamNumber, 890 - ctx.measureText(teamNumber).width / 2, 190);

  ctx.fillStyle = C.purpleLight;
  roundRect(ctx, 82, 330, width - 164, 130, 28);
  ctx.fill();

  ctx.fillStyle = C.purple;
  ctx.font = "700 20px Arial";
  ctx.fillText("BEGEGNUNG", 112, 372);

  ctx.fillStyle = C.zinc900;
  ctx.font = "700 40px Arial";
  const opp = match.opponent.length > 32 ? `${match.opponent.slice(0, 29)}…` : match.opponent;
  ctx.fillText(opp, 112, 425);

  const infoY = 490;
  const boxGap = 22;
  const boxWidth = (width - 164 - boxGap * 2) / 3;

  [
    { title: "MANNSCHAFT", value: team.name },
    { title: "TERMIN",     value: `${formatDate(match.date)} · ${match.time} Uhr` },
    { title: "ORT",        value: match.venue === "home" ? "HEIMSPIEL" : "AUSWÄRTSSPIEL" },
  ].forEach((box, i) => {
    const x = 82 + i * (boxWidth + boxGap);
    ctx.fillStyle = C.zinc100;
    roundRect(ctx, x, infoY, boxWidth, 112, 24);
    ctx.fill();
    ctx.fillStyle = C.zinc500;
    ctx.font = "700 17px Arial";
    ctx.fillText(box.title, x + 22, infoY + 34);
    ctx.fillStyle = C.zinc900;
    ctx.font = "700 24px Arial";
    const val = box.value.length > 24 ? `${box.value.slice(0, 21)}…` : box.value;
    ctx.fillText(val, x + 22, infoY + 78);
  });

  const sectionTop = 650;
  const colWidth = (width - 164 - 28) / 2;

  drawPlayerColumn(ctx, {
    x: 82, y: sectionTop, width: colWidth,
    title: "EINZEL", accent: C.purple,
    labels: ["E1", "E2", "E3", "E4"], values: lineup.singles, fallback: "Noch offen",
  });
  drawPlayerColumn(ctx, {
    x: 82 + colWidth + 28, y: sectionTop, width: colWidth,
    title: "DOPPEL", accent: C.purpleDark,
    labels: ["D1", "D2", "D3", "D4"], values: lineup.doubles, fallback: "Noch offen",
  });
  drawBenchSection(ctx, {
    x: 82, y: 1045, width: width - 164,
    title: "ERSATZ / OPTIONEN",
    values: lineup.bench.filter(Boolean),
  });

  const selectedCount = [...lineup.singles, ...lineup.doubles].filter(Boolean).length;
  const isComplete = selectedCount === 8;

  ctx.fillStyle = isComplete ? "#ecfdf5" : "#fef2f2";
  roundRect(ctx, 82, 1190, width - 164, 70, 22);
  ctx.fill();

  ctx.fillStyle = isComplete ? C.emerald : C.red;
  ctx.font = "700 24px Arial";
  ctx.fillText(
    isComplete
      ? "Aufstellung vollständig gesetzt"
      : `Aufstellung unvollständig (${selectedCount}/8 gesetzt)`,
    112, 1234
  );

  ctx.fillStyle = C.zinc500;
  ctx.font = "500 18px Arial";
  ctx.fillText("Erstellt mit dem Linden 07 Tennisplaner", 82, 1305);

  const link = document.createElement("a");
  link.download = [
    "aufstellung-share",
    slugifyFilePart(team.name),
    slugifyFilePart(match.opponent),
    match.date,
  ].filter(Boolean).join("-") + ".jpg";
  link.href = canvas.toDataURL("image/jpeg", 0.94);
  link.click();
}

// ─── UI-Komponenten ───────────────────────────────────────────────────────────

function Chevron({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-zinc-300 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function Badge({ children, variant = "default" }) {
  const styles = {
    default: "border-violet-100 bg-violet-50 text-violet-800",
    muted:   "border-zinc-200 bg-zinc-50 text-zinc-500",
    black:   "border-black bg-black text-white",
    green:   "border-emerald-200 bg-emerald-50 text-emerald-700",
    red:     "border-red-200 bg-red-50 text-red-700",
    amber:   "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function ResponseBadge({ value }) {
  if (value === "available-both")    return <Badge variant="black">Beides</Badge>;
  if (value === "available-singles") return <Badge>Einzel</Badge>;
  if (value === "available-doubles") return <Badge>Doppel</Badge>;
  if (value === "unavailable")       return <Badge variant="muted">Nicht dabei</Badge>;
  return <Badge variant="muted">Offen</Badge>;
}

function AvailabilityPicker({ value, onChange }) {
  const options = [
    { value: "available-singles", label: "Einzel",      activeClass: "bg-violet-100 border-violet-400 text-violet-900" },
    { value: "available-doubles", label: "Doppel",      activeClass: "bg-violet-100 border-violet-400 text-violet-900" },
    { value: "available-both",    label: "Beides",      activeClass: "bg-violet-900 border-violet-900 text-white"      },
    { value: "unavailable",       label: "Nicht dabei", activeClass: "bg-zinc-800 border-zinc-800 text-white"          },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? DEFAULT_RESPONSE : opt.value)}
          className={`rounded-2xl border-2 py-3.5 text-sm font-semibold transition-all active:scale-95 ${
            value === opt.value ? opt.activeClass : "border-zinc-200 bg-white text-zinc-600 active:bg-zinc-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function LineupSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-violet-400"
      >
        <option value="">— frei —</option>
        {options.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name} · LK {lkStr(p.lk)} · {responseLabel(p.response)}
          </option>
        ))}
      </select>
    </label>
  );
}

// ─── Haupt-App ────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [responses, setResponses]           = useState(() => buildInitialResponses());
  const [lineups, setLineups]               = useState(() => buildInitialLineups());
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [activeTab, setActiveTab]           = useState("kalender");
  const [authorizedCaptains, setAuthorizedCaptains] = useState({});
  const saveTimer = useRef({});

  const isCaptainSelection = CAPTAIN_OPTIONS.some((c) => c.label === selectedPlayer);
  const isCaptainView      = isCaptainSelection && authorizedCaptains[selectedPlayer] === true;
  const hasSelection       = Boolean(selectedPlayer);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchJsonSafe("/api/responses"), fetchJsonSafe("/api/lineups")])
      .then(([responsesResult, lineupsResult]) => {
        if (cancelled) return;
        if (responsesResult.status === "fulfilled") {
          const data = responsesResult.value;
          if (data && Object.keys(data).length > 0) {
            setResponses((prev) => {
              const merged = { ...prev };
              Object.entries(data).forEach(([matchId, players]) => {
                if (merged[matchId]) merged[matchId] = { ...merged[matchId], ...players };
              });
              return merged;
            });
          }
        }
        if (lineupsResult.status === "fulfilled") {
          const data = lineupsResult.value;
          if (data && Object.keys(data).length > 0) {
            setLineups((prev) => {
              const merged = { ...prev };
              Object.entries(data).forEach(([matchId, lineup]) => {
                if (merged[matchId]) merged[matchId] = normalizeLineup(lineup);
              });
              return merged;
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function handlePlayerChange(name) {
    if (!name) { setSelectedPlayer(""); setActiveTab("kalender"); return; }

    const isCaptain = CAPTAIN_OPTIONS.some((c) => c.label === name);
    if (isCaptain) {
      if (authorizedCaptains[name]) { setSelectedPlayer(name); setActiveTab("kapitaen"); return; }
      const pin = window.prompt(`PIN für ${name} eingeben:`);
      if (pin === null) return;
      if (pin !== CAPTAIN_PIN) { window.alert("Falscher PIN."); return; }
      setAuthorizedCaptains((prev) => ({ ...prev, [name]: true }));
      setSelectedPlayer(name);
      setActiveTab("kapitaen");
      return;
    }
    setSelectedPlayer(name);
    setActiveTab("kalender");
  }

  // Debounced: verhindert API-Spam bei schnellen Klicks
  function persistTo(url, payload) {
    clearTimeout(saveTimer.current[url]);
    setSaving(true);
    saveTimer.current[url] = setTimeout(() => {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {}).finally(() => setSaving(false));
    }, 600);
  }

  function saveResponse(matchId, playerName, value) {
    setResponses((prev) => {
      const next = { ...prev, [matchId]: { ...prev[matchId], [playerName]: value } };
      persistTo("/api/responses", next);
      return next;
    });
  }

  function saveLineup(matchId, lineup) {
    setLineups((prev) => {
      const next = { ...prev, [matchId]: normalizeLineup(lineup) };
      persistTo("/api/lineups", next);
      return next;
    });
  }

  const visibleTeams = useMemo(() => {
    if (!selectedPlayer || isCaptainView) return TEAMS;
    const teamIds = new Set(ALL_PLAYERS.find((p) => p.name === selectedPlayer)?.teams || []);
    return TEAMS.filter((t) => teamIds.has(t.id));
  }, [selectedPlayer, isCaptainView]);

  const boardMatches = useMemo(
    () => sortByDate(visibleTeams.flatMap((t) => t.matches.map((m) => ({ ...m, teamId: t.id, teamName: t.name })))),
    [visibleTeams]
  );

  const tabs = useMemo(() => [
    ...(isCaptainView ? [{ id: "kapitaen", label: "Übersicht" }] : []),
    { id: "kalender", label: "Kalender" },
    { id: "spieler",  label: "Spieler"  },
  ], [isCaptainView]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-2xl font-bold text-violet-900">Linden 07</div>
          <div className="mt-2 text-sm text-zinc-400">Lade Rückmeldungen…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">

      {saving && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-violet-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          Wird gespeichert…
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Linden 07</div>
              <div className="text-base font-bold leading-tight">Tennisplaner 2026</div>
            </div>
            <select
              value={selectedPlayer}
              onChange={(e) => handlePlayerChange(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-800 outline-none focus:border-violet-400 focus:bg-white"
            >
              <option value="">Name wählen…</option>
              {CAPTAIN_OPTIONS.map((c) => (
                <option key={c.id} value={c.label}>👑 {c.label}</option>
              ))}
              {ALL_PLAYERS.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {hasSelection && (
            <div className="flex gap-0.5 pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                    activeTab === tab.id ? "bg-violet-900 text-white" : "text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 pb-16 pt-4">
        {!hasSelection && (
          <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-sm">
            <div className="text-5xl">🎾</div>
            <div className="mt-4 text-lg font-bold">Willkommen!</div>
            <div className="mt-2 text-sm text-zinc-500 max-w-xs mx-auto">
              Wähle oben deinen Namen, um deine Spiele zu sehen und dich an- oder abzumelden.
            </div>
          </div>
        )}

        {hasSelection && activeTab === "kalender" && (
          <KalenderTab
            visibleTeams={visibleTeams}
            responses={responses}
            selectedPlayer={selectedPlayer}
            isCaptainView={isCaptainView}
            saveResponse={saveResponse}
          />
        )}

        {hasSelection && activeTab === "spieler" && (
          <SpielerTab visibleTeams={visibleTeams} />
        )}

        {hasSelection && activeTab === "kapitaen" && isCaptainView && (
          <KapitaenTab
            boardMatches={boardMatches}
            responses={responses}
            lineups={lineups}
            saveLineup={saveLineup}
          />
        )}
      </main>
    </div>
  );
}

// ─── Kalender Tab ─────────────────────────────────────────────────────────────

function KalenderTab({ visibleTeams, responses, selectedPlayer, isCaptainView, saveResponse }) {
  const byMonth = useMemo(() => {
    const allMatches = sortByDate(
      visibleTeams.flatMap((t) =>
        t.matches.map((m) => ({ ...m, teamId: t.id, teamName: t.name, teamNumber: t.number }))
      )
    );
    return allMatches.reduce((acc, m) => {
      const key = formatMonth(m.date);
      (acc[key] = acc[key] || []).push(m);
      return acc;
    }, {});
  }, [visibleTeams]);

  return (
    <div className="space-y-5">
      {Object.entries(byMonth).map(([month, matches]) => (
        <div key={month}>
          <div className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-zinc-400">{month}</div>
          <div className="space-y-2">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                team={visibleTeams.find((t) => t.id === match.teamId)}
                responses={responses}
                selectedPlayer={selectedPlayer}
                isCaptainView={isCaptainView}
                saveResponse={saveResponse}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match, team, responses, selectedPlayer, isCaptainView, saveResponse }) {
  const [open, setOpen]               = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const counts  = getCounts(match.id, responses);
  const traffic = getTrafficLight(counts.totalAvailable);
  const myValue = responses[match.id]?.[selectedPlayer] || DEFAULT_RESPONSE;

  const availableNames = useMemo(
    () => Object.entries(responses[match.id] || {})
      .filter(([, v]) => v?.startsWith("available"))
      .map(([name]) => name),
    [responses, match.id]
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-zinc-50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-900">
          {match.teamNumber}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{match.opponent}</div>
          <div className="truncate text-xs text-zinc-400">
            {formatDate(match.date)}{match.time ? ` · ${match.time}` : ""} · {match.venue === "home" ? "Heim" : "Auswärts"}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${traffic.bg} ${traffic.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${traffic.dot}`} />
            {counts.totalAvailable}/8
          </div>
          {!isCaptainView && myValue !== "open" && <ResponseBadge value={myValue} />}
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-zinc-100 px-4 pb-5 pt-4">
          {!isCaptainView && (
            <div>
              <div className="mb-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400">Deine Verfügbarkeit</div>
              <AvailabilityPicker
                value={myValue}
                onChange={(v) => saveResponse(match.id, selectedPlayer, v)}
              />
            </div>
          )}

          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
              Dabei ({counts.totalAvailable})
            </div>
            {availableNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {availableNames.map((name) => <Badge key={name}>{name}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Noch keine Rückmeldungen</p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Einzel: {counts.singles}</span>
            <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Doppel: {counts.doubles}</span>
            <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Beides: {counts.both}</span>
            <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Nicht dabei: {counts.unavailable}</span>
          </div>

          {isCaptainView && team && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Alle Spieler</div>
              <div className="space-y-2">
                {[...team.starters, ...team.reserves].map((p) => {
                  const v = responses[match.id]?.[p.name] || DEFAULT_RESPONSE;
                  const isEditing = editingPlayer === p.name;
                  return (
                    <div key={p.name} className="rounded-xl bg-zinc-50">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer((prev) => (prev === p.name ? null : p.name))}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left active:bg-zinc-100"
                      >
                        <span className="text-sm font-medium">{p.name}{p.captain ? " 👑" : ""}</span>
                        <div className="flex items-center gap-2">
                          <ResponseBadge value={v} />
                          <Chevron open={isEditing} />
                        </div>
                      </button>
                      {isEditing && (
                        <div className="border-t border-zinc-200 px-3 pb-3 pt-3">
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                            Rückmeldung für {p.name} ändern
                          </div>
                          <AvailabilityPicker
                            value={v}
                            onChange={(nextValue) => saveResponse(match.id, p.name, nextValue)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spieler Tab ──────────────────────────────────────────────────────────────

function SpielerTab({ visibleTeams }) {
  return (
    <div className="space-y-3">
      {visibleTeams.map((team) => (
        <div key={team.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-violet-950 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-yellow-300 bg-yellow-400 text-sm font-black text-black">
                {team.number}
              </div>
              <div>
                <div className="font-bold text-white">{team.name}</div>
                <div className="text-xs text-violet-300">{team.league}</div>
              </div>
            </div>
            <div className="mt-1.5 text-xs text-violet-400">
              Kapitän: <span className="font-semibold text-violet-200">{team.captain}</span>
            </div>
          </div>
          <div className="divide-y divide-zinc-100 p-4 space-y-4">
            <PlayerGroup label="Stammspieler" players={team.starters} />
            <div className="pt-3">
              <PlayerGroup label="Reservespieler" players={team.reserves} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayerGroup({ label, players }) {
  const sorted = useMemo(() => [...players].sort((a, b) => a.lk - b.lk), [players]);
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</div>
      <div className="space-y-1">
        {sorted.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5">
            <span className="w-5 text-center text-xs font-bold text-zinc-300">{i + 1}</span>
            <span className="flex-1 text-sm font-medium">{p.name}{p.captain ? " 👑" : ""}</span>
            <span className="text-xs text-zinc-400">LK {lkStr(p.lk)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kapitän Tab ──────────────────────────────────────────────────────────────

function KapitaenTab({ boardMatches, responses, lineups, saveLineup }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-violet-950 px-4 py-3.5 text-white">
        <div className="font-bold">Kapitänsübersicht</div>
        <div className="text-xs text-violet-400 mt-0.5">Empfehlungen, finale Aufstellungen und JPG-Export</div>
      </div>
      {boardMatches.map((match) => {
        const team   = TEAMS.find((t) => t.id === match.teamId);
        const lineup = normalizeLineup(lineups[match.id]);
        return (
          <MatchRecommendation
            key={match.id}
            match={match}
            team={team}
            responses={responses}
            lineup={lineup}
            saveLineup={saveLineup}
          />
        );
      })}
    </div>
  );
}

function MatchRecommendation({ match, team, responses, lineup, saveLineup }) {
  const [open, setOpen] = useState(true);

  const rec = useMemo(
    () => buildRecommendation(team, match.id, responses),
    [team, match.id, responses]
  );
  const roster = useMemo(
    () => getTeamRosterForMatch(team, match.id, responses),
    [team, match.id, responses]
  );

  const traffic     = getTrafficLight(rec.totalSelected);
  const lineupCount = getLineupCompletionCount(lineup);

  function updateLineupSection(section, index, value) {
    saveLineup(match.id, {
      ...lineup,
      [section]: lineup[section].map((v, i) => (i === index ? value : v)),
    });
  }

  function applyRecommendation() {
    saveLineup(match.id, {
      singles: rec.singles.map((p) => p.name),
      doubles: rec.doubles.map((p) => p.name),
      bench:   rec.bench.slice(0, 4).map((p) => p.name),
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-zinc-50"
      >
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{match.teamName}</div>
          <div className="truncate text-sm text-zinc-600">{match.opponent}</div>
          <div className="text-xs text-zinc-400">
            {formatDate(match.date)}{match.time ? ` · ${match.time} Uhr` : ""} · {match.venue === "home" ? "Heimspiel" : "Auswärtsspiel"}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${traffic.bg} ${traffic.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${traffic.dot}`} />
            Empfehlung {rec.totalSelected}/8
          </div>
          <div className="flex gap-1">
            {rec.captainIncluded
              ? <Badge variant="green">Kapitän ✓</Badge>
              : <Badge variant="red">Kapitän fehlt</Badge>
            }
            <Badge variant={lineupCount === 8 ? "green" : lineupCount > 0 ? "amber" : "muted"}>
              Aufstellung {lineupCount}/8
            </Badge>
          </div>
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-zinc-100 px-4 pb-5 pt-4">

          <RecSection title="Empfohlene Einzel" empty="Noch keine belastbare Einzel-Besetzung.">
            {rec.singles.map((p, i) => <PlayerRow key={p.name} prefix={`E${i + 1}`} player={p} />)}
          </RecSection>

          <RecSection title="Empfohlene Doppel" empty="Noch keine belastbare Doppel-Besetzung.">
            {rec.doubles.map((p, i) => <PlayerRow key={p.name} prefix={`D${i + 1}`} player={p} />)}
          </RecSection>

          {rec.doublePairs.length > 0 && (
            <RecSection title="Doppelpaarungen" empty="">
              {rec.doublePairs.map((pair, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5">
                  <span className="w-6 text-center text-xs font-black text-violet-400">D{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{pair[0]?.name} / {pair[1]?.name}</span>
                  <Badge>Σ {lkStr((pair[0].lk + pair[1].lk).toFixed(1))}</Badge>
                </div>
              ))}
            </RecSection>
          )}

          {rec.bench.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Weitere verfügbar</div>
              <div className="flex flex-wrap gap-1.5">
                {rec.bench.map((p) => <Badge key={p.name} variant="muted">{p.name} · LK {lkStr(p.lk)}</Badge>)}
              </div>
            </div>
          )}

          <div className="border-t border-zinc-100 pt-4">
            <div className="mb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Endgültige Aufstellung</div>
              <div className="mt-1 text-sm text-zinc-500">
                Frei wählbar durch den Kapitän. Die Share-Grafik basiert auf dieser Aufstellung.
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyRecommendation}
                className="rounded-xl bg-violet-900 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95"
              >
                Empfehlung übernehmen
              </button>
              <button
                type="button"
                onClick={() => saveLineup(match.id, createEmptyLineup())}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition active:scale-95"
              >
                Aufstellung zurücksetzen
              </button>
              <button
                type="button"
                onClick={() => exportLineupAsJpg({ match, team, lineup })}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition active:scale-95"
              >
                Share-Grafik als JPG
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <LineupSection
                title="Einzel" sectionKey="singles" labels={["E1", "E2", "E3", "E4"]}
                values={lineup.singles} players={roster} lineup={lineup} onChange={updateLineupSection}
              />
              <LineupSection
                title="Doppel" sectionKey="doubles" labels={["D1", "D2", "D3", "D4"]}
                values={lineup.doubles} players={roster} lineup={lineup} onChange={updateLineupSection}
              />
            </div>

            <div className="mt-4">
              <LineupSection
                title="Ersatzbank" sectionKey="bench" labels={["Bank 1", "Bank 2", "Bank 3", "Bank 4"]}
                values={lineup.bench} players={roster} lineup={lineup} onChange={updateLineupSection}
              />
            </div>

            <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-bold">Export-Vorschau</div>
                <Badge variant={lineupCount === 8 ? "green" : lineupCount > 0 ? "amber" : "muted"}>
                  {lineupCount}/8 gesetzt
                </Badge>
              </div>
              <div className="space-y-3">
                <PreviewMeta match={match} team={team} />
                <PreviewLine title="Einzel" values={lineup.singles} responses={responses[match.id] || {}} />
                <PreviewLine title="Doppel" values={lineup.doubles} responses={responses[match.id] || {}} />
                <PreviewLine title="Bank"   values={lineup.bench}   responses={responses[match.id] || {}} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LineupSection({ title, sectionKey, labels, values, players, lineup, onChange }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</div>
      <div className="grid gap-3">
        {labels.map((label, index) => (
          <LineupSelect
            key={`${sectionKey}-${index}`}
            label={label}
            value={values[index]}
            onChange={(value) => onChange(sectionKey, index, value)}
            options={getLineupSelectOptions(players, lineup, values[index])}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewMeta({ match, team }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <div className="text-sm font-bold">{team.name}</div>
      <div className="text-sm text-zinc-600">{match.opponent}</div>
      <div className="mt-1 text-xs text-zinc-400">
        {formatDate(match.date)}{match.time ? ` · ${match.time} Uhr` : ""} · {match.venue === "home" ? "Heimspiel" : "Auswärtsspiel"}
      </div>
    </div>
  );
}

function PreviewLine({ title, values, responses }) {
  const filtered = values.filter(Boolean);
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</div>
      <div className="space-y-1">
        {filtered.length > 0 ? (
          filtered.map((name, idx) => (
            <div key={`${title}-${idx}-${name}`} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
              <span className="text-sm font-medium">{name}</span>
              <ResponseBadge value={responses[name] || DEFAULT_RESPONSE} />
            </div>
          ))
        ) : (
          <div className="text-sm text-zinc-400">Noch nichts ausgewählt.</div>
        )}
      </div>
    </div>
  );
}

function RecSection({ title, empty, children }) {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</div>
      {hasChildren ? <div className="space-y-1">{children}</div> : <p className="text-sm text-zinc-400">{empty}</p>}
    </div>
  );
}

function PlayerRow({ prefix, player }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5">
      <span className="w-6 text-center text-xs font-black text-violet-400">{prefix}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{player.name}</div>
        <div className="text-xs text-zinc-400">{player.squadType} · LK {lkStr(player.lk)}</div>
      </div>
      <ResponseBadge value={player.response} />
    </div>
  );
}
