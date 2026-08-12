// Export the complete World Cup 2026 (Polymarket series 11433) archive as
// analyzable datasets. Writes to ../data/wc2026/.
//
// Important data caveat (verified 2026-08): once a match closes Polymarket
// disables its order book and the per-market CLOB price history is purged
// (returns 0 points). So per-MATCH odds-over-time is NOT recoverable — only
// the final resolved result survives. The long-running FUTURES markets
// (world-cup-winner) DO retain full history, so the title race is complete.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Written under public/ so the static archive page can fetch it directly
// (vercel.json serves /(.*) from public/), and so it deploys with the site.
const OUT = path.join(__dirname, "..", "public", "data", "wc2026");
const GAMMA = "https://gamma-api.polymarket.com";
const CLOB = "https://clob.polymarket.com";
const SERIES = "11433";
const TOURNAMENT_START = "2026-06-11"; // first match; used to snapshot pre-tournament odds

const parse = (s) => { try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Resilient GET: per-request timeout + backoff retries, to ride out the
// intermittent cold-connection timeouts seen on this network.
async function gj(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await fetch(url, { signal: ac.signal });
      clearTimeout(t);
      if (r.ok) return await r.json();
    } catch { clearTimeout(t); }
    await sleep(400 * (i + 1));
  }
  return null;
}
const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const toCsv = (rows, cols) => [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");

// ---- 1) Pull every event in the series (paginated) --------------------------
async function allEvents() {
  const map = new Map();
  for (let off = 0; off < 1500; off += 100) {
    const evs = await gj(`${GAMMA}/events?series_id=${SERIES}&limit=100&offset=${off}`);
    if (!Array.isArray(evs) || !evs.length) break;
    for (const e of evs) if (!map.has(e.slug)) map.set(e.slug, e);
    if (evs.length < 100) break;
  }
  return [...map.values()];
}

// ---- 2) Derive a match's results ------------------------------------------
// Two DIFFERENT things, previously conflated:
//   result90  — the 90-minute outcome. In knockouts "Draw" is a legitimate
//               settlement (match went to extra time / penalties).
//   advanced  — who actually progressed. Comes from the soccer_team_to_advance
//               market, which settles 1 for the side that went through. This is
//               the column to use for a bracket; result90 is NOT.
function matchResult(parent, allMarkets, home = "", away = "") {
  const mls = (parent.markets || []).filter((m) => m.sportsMarketType === "moneyline");
  let result90 = null;
  for (const m of mls) {
    const outs = parse(m.outcomes) || [];
    const prices = (parse(m.outcomePrices) || []).map(Number);
    const yi = outs.findIndex((o) => /^yes$/i.test(o));
    if (yi >= 0 && prices[yi] >= 0.99) result90 = m.groupItemTitle;
  }
  if (/^draw\b/i.test(result90 || "")) result90 = "Draw";

  let advanced = null;
  for (const m of allMarkets.filter((x) => x.sportsMarketType === "soccer_team_to_advance")) {
    const outs = parse(m.outcomes) || [];
    const prices = (parse(m.outcomePrices) || []).map(Number);
    outs.forEach((o, i) => { if (prices[i] >= 0.99) advanced = o; });
  }
  // Recover the actual 90-min scoreline from the settled exact-score market:
  // exactly one of them settles Yes. (Gamma's own `score` field is empty for
  // these archived events, so this is the only reliable source.)
  let score = "";
  for (const m of allMarkets.filter((x) => x.sportsMarketType === "soccer_exact_score")) {
    const outs = parse(m.outcomes) || [];
    const prices = (parse(m.outcomePrices) || []).map(Number);
    const yi = outs.findIndex((o) => /^yes$/i.test(o));
    if (yi >= 0 && prices[yi] >= 0.99) {
      const g = m.groupItemTitle || "";
      const mm = g.match(/(\d+)\s*-\s*(\d+)/);
      if (mm) score = `${mm[1]}-${mm[2]}`;
    }
  }

  // Blowouts fall outside the exact-score grid (0-0..3-3) and settle as
  // "Any Other Score", leaving no scoreline. Recover those by intersecting the
  // settled Over/Under ladders: totals give the match total, team_totals give
  // each side's goals. scoreSource records which method was used.
  let scoreSource = score ? "exact_score" : "";
  if (!score) {
    const won = (m, re) => {
      const outs = parse(m.outcomes) || [];
      const prices = (parse(m.outcomePrices) || []).map(Number);
      const i = outs.findIndex((o) => re.test(o));
      return i >= 0 && prices[i] >= 0.99;
    };
    const lineOf = (s) => parseFloat(String(s).replace(/[^0-9.]/g, ""));
    let lo = 0, hi = Infinity;
    for (const m of allMarkets.filter((x) => x.sportsMarketType === "totals")) {
      const line = lineOf(m.groupItemTitle);
      if (!Number.isFinite(line)) continue;
      if (won(m, /^over$/i)) lo = Math.max(lo, Math.ceil(line));
      if (won(m, /^under$/i)) hi = Math.min(hi, Math.floor(line));
    }
    const per = new Map();
    for (const m of allMarkets.filter((x) => x.sportsMarketType === "soccer_team_totals")) {
      const g = m.groupItemTitle || "";
      const team = g.replace(/O\/U.*/i, "").trim();
      const line = lineOf(g);
      if (!team || !Number.isFinite(line)) continue;
      const cur = per.get(team) || { lo: 0, hi: Infinity };
      if (won(m, /^over$/i)) cur.lo = Math.max(cur.lo, Math.ceil(line));
      if (won(m, /^under$/i)) cur.hi = Math.min(cur.hi, Math.floor(line));
      per.set(team, cur);
    }
    const exact = [...per.entries()].filter(([, v]) => v.lo === v.hi);
    const pick = (team) => {
      const hit = [...per.entries()].find(([k]) => k.toLowerCase().includes(team.toLowerCase()) || team.toLowerCase().includes(k.toLowerCase()));
      return hit && hit[1].lo === hit[1].hi ? hit[1].lo : null;
    };
    const hg = pick(home), ag = pick(away);
    if (hg != null && ag != null) { score = `${hg}-${ag}`; scoreSource = "totals_ladder"; }
    else if (lo === hi && exact.length === 1) {
      const [k, v] = exact[0];
      const known = v.lo, other = lo - known;
      const knownIsHome = home.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(home.toLowerCase());
      if (other >= 0) { score = knownIsHome ? `${known}-${other}` : `${other}-${known}`; scoreSource = "totals_ladder"; }
    }
  }

  // Extra time / shootout: the market only tells us what happened if it
  // settled Yes — mere existence of the market means nothing.
  const settledYes = (type) => allMarkets.some((m) => {
    if (m.sportsMarketType !== type) return false;
    const outs = parse(m.outcomes) || [];
    const prices = (parse(m.outcomePrices) || []).map(Number);
    const yi = outs.findIndex((o) => /^yes$/i.test(o));
    return yi >= 0 && prices[yi] >= 0.99;
  });
  return { result90, advanced, score, scoreSource, wentToExtra: settledYes("soccer_extra_time"), hadShootout: settledYes("soccer_penalty_shootout") };
}

// stage heuristic by kickoff date (2026 WC calendar buckets)
function stageOf(dateIso) {
  const d = (dateIso || "").slice(0, 10);
  if (!d) return "unknown";
  if (d <= "2026-06-27") return "Group";
  if (d <= "2026-07-03") return "Round of 32";
  if (d <= "2026-07-07") return "Round of 16";
  if (d <= "2026-07-11") return "Quarterfinal";
  if (d <= "2026-07-15") return "Semifinal";
  if (d <= "2026-07-18") return "Third place";
  return "Final";
}

function teamsOf(title) {
  const m = (title || "").split(/\s+vs\.?\s+/i);
  return { home: (m[0] || "").trim(), away: (m[1] || "").trim() };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log("Fetching all series events…");
  const events = await allEvents();
  console.log("  unique events:", events.length);

  const parents = events.filter((e) => (e.markets || []).some((m) => m.sportsMarketType === "moneyline"));
  console.log("  match parents (moneyline):", parents.length);
  if (parents.length === 0) {
    console.error("\nAborting: got 0 match events — network dropped mid-fetch. NOT overwriting with empty files. Just re-run the command.");
    process.exit(1);
  }

  // ---- matches + full market inventory ----
  const matches = [];
  const marketRows = [];
  // Team identity (flag/colour/abbr) as published on the events themselves —
  // same source the live dashboard uses, so the archive looks consistent.
  const teamInfo = new Map();
  for (const e of events) {
    for (const t of e.teams || []) {
      if (!t?.name || teamInfo.has(t.name)) continue;
      teamInfo.set(t.name, {
        name: t.name,
        abbr: String(t.abbreviation || "").toUpperCase(),
        flag: t.logo || null,
        color: t.color || null,
      });
    }
  }
  for (const p of parents) {
    const kids = events.filter((e) => e.slug !== p.slug && e.slug.startsWith(p.slug + "-"));
    const allMk = [...(p.markets || []), ...kids.flatMap((k) => k.markets || [])];
    const { home, away } = teamsOf(p.title);
    const { result90, advanced, score, scoreSource, wentToExtra, hadShootout } = matchResult(p, allMk, home, away);
    matches.push({
      slug: p.slug,
      title: p.title,
      home, away,
      date: p.endDate || p.startDate || "",
      stage: stageOf(p.endDate),
      result90,          // 90-minute outcome ("Draw" is valid, incl. knockouts)
      advanced,          // who progressed (knockouts only; null in group stage)
      wentToExtra,
      hadShootout,
      score,             // 90-min scoreline
      scoreSource,       // "exact_score" (direct) | "totals_ladder" (derived) | ""
      marketCount: allMk.length,
      marketTypes: [...new Set(allMk.map((m) => m.sportsMarketType).filter(Boolean))].sort(),
      childEvents: kids.length,
    });
    for (const m of allMk) {
      const outs = parse(m.outcomes) || [];
      const prices = (parse(m.outcomePrices) || []).map(Number);
      outs.forEach((o, i) => marketRows.push({
        match_slug: p.slug, stage: stageOf(p.endDate), date: (p.endDate || "").slice(0, 10),
        market_slug: m.slug, type: m.sportsMarketType || "", group: m.groupItemTitle || "",
        question: m.question || "", outcome: o, resolved_price: prices[i] ?? "",
      }));
    }
  }
  matches.sort((a, b) => new Date(a.date) - new Date(b.date));

  // ---- title race: 60 teams' champion-odds time series (futures, retained) ----
  console.log("Fetching title race (world-cup-winner)…");
  const winEv = await gj(`${GAMMA}/events/slug/world-cup-winner`);
  const titleRace = [];
  const titleLong = [];
  if (winEv && Array.isArray(winEv.markets)) {
    let done = 0;
    for (const m of winEv.markets) {
      const team = m.groupItemTitle || m.question || "";
      const tok = (parse(m.clobTokenIds) || [])[0];
      const outs = parse(m.outcomes) || [];
      const prices = (parse(m.outcomePrices) || []).map(Number);
      const yi = outs.findIndex((o) => /^yes$/i.test(o));
      const champion = yi >= 0 && prices[yi] >= 0.99;
      // Full-span history. fidelity=360 was observed to return only a short
      // recent window; max+720 returns the whole life of the market. Try the
      // widest form first and fall back through variants until one has data.
      let series = [];
      if (tok) {
        const attempts = [
          `interval=max&fidelity=720`,
          `interval=max&fidelity=1440`,
          `startTs=1719792000&endTs=${Math.floor(Date.now() / 1000)}&fidelity=720`,
          `interval=max`,
        ];
        for (const q of attempts) {
          const h = await gj(`${CLOB}/prices-history?market=${tok}&${q}`);
          const pts = (h && h.history) || [];
          if (pts.length > series.length) series = pts.map((pt) => ({ t: pt.t, p: pt.p }));
          if (series.length > 100) break; // good enough span, stop probing
          await sleep(80);
        }
        await sleep(60);
      }
      // A market opens quoted at the 0.50 default and stays there until the
      // first real trade. Those 0.50s are placeholders, not market beliefs —
      // left in, they make longshots look like 50% favourites and destroy any
      // calibration study. Drop them, and expose a clean pre-tournament price.
      const isPlaceholder = (p) => Math.abs(p.p - 0.5) < 1e-9;
      const clean = series.filter((p) => !isPlaceholder(p));
      const uniq = new Set(clean.map((p) => p.p));
      const tradeable = clean.length > 5 && uniq.size > 2;
      const beforeKickoff = clean.filter((p) => new Date(p.t * 1000).toISOString().slice(0, 10) < TOURNAMENT_START);
      const preTournamentProb = beforeKickoff.length ? beforeKickoff[beforeKickoff.length - 1].p : null;
      const peakProb = clean.length ? Math.max(...clean.map((p) => p.p)) : null;
      titleRace.push({ team, champion, points: clean.length, tradeable, preTournamentProb, peakProb, series: clean });
      for (const pt of clean) titleLong.push({ team, tradeable, date: new Date(pt.t * 1000).toISOString().slice(0, 10), ts: pt.t, prob: pt.p });
      if (++done % 10 === 0) console.log(`  title-race … ${done}/${winEv.markets.length}`);
    }
  }
  titleRace.sort((a, b) => (b.champion - a.champion) || (b.points - a.points));
  const champion = titleRace.find((t) => t.champion);
  console.log("  champion:", champion ? champion.team : "(unknown)", "| teams:", titleRace.length);

  // ---- write files ----
  const meta = {
    generatedAt: new Date().toISOString(),
    source: `Polymarket Gamma series ${SERIES}`,
    champion: champion ? champion.team : null,
    matchCount: matches.length,
    marketRowCount: marketRows.length,
    titleRaceTeams: titleRace.length,
    caveats: [
      "Per-match CLOB price history is purged after close (0 points) — per-match odds-over-time is NOT recoverable; only final results survive.",
      "The world-cup-winner futures markets retain full history — title-race.json is complete.",
      "stage is a date-heuristic; verify around round boundaries.",
      "result90 is the 90-MINUTE outcome; 'Draw' is valid even in knockouts (match went to ET/pens). Use `advanced` (from soccer_team_to_advance) to build a bracket — never result90.",
      "title-race: 0.50 points are pre-first-trade placeholder quotes, NOT market beliefs — they are stripped from `series`. Use preTournamentProb for 'what the market thought before kickoff'; never series[0], which is the market-open default.",
      "title-race: rows with tradeable=false are illiquid markets with almost no price discovery. EXCLUDE them from calibration/accuracy analysis.",
    ],
  };
  await writeFile(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2));
  await writeFile(path.join(OUT, "matches.json"), JSON.stringify(matches, null, 2));
  await writeFile(path.join(OUT, "matches.csv"), toCsv(
    matches.map((m) => ({ ...m, marketTypes: m.marketTypes.join("|") })),
    ["date", "stage", "slug", "home", "away", "score", "scoreSource", "result90", "advanced", "wentToExtra", "hadShootout", "marketCount", "childEvents", "marketTypes"]));
  await writeFile(path.join(OUT, "markets.csv"), toCsv(marketRows,
    ["date", "stage", "match_slug", "market_slug", "type", "group", "question", "outcome", "resolved_price"]));
  await writeFile(path.join(OUT, "teams.json"), JSON.stringify([...teamInfo.values()], null, 2));
  await writeFile(path.join(OUT, "title-race.json"), JSON.stringify(titleRace, null, 2));
  await writeFile(path.join(OUT, "title-race-long.csv"), toCsv(titleLong, ["team", "tradeable", "date", "ts", "prob"]));

  console.log("\nWrote to", OUT);
  console.log("  meta.json, matches.json, matches.csv, markets.csv, title-race.json, title-race-long.csv");
  console.log("  matches:", matches.length, "| market rows:", marketRows.length, "| title-race points:", titleLong.length);

  // Data-quality report so gaps are obvious instead of silent.
  const withHist = titleRace.filter((t) => t.points > 0);
  const tradeable = titleRace.filter((t) => t.tradeable);
  const resolved = matches.filter((m) => m.result90).length;
  const ko = matches.filter((m) => m.stage !== "Group");
  const koAdv = ko.filter((m) => m.advanced).length;
  console.log("\nQUALITY CHECK");
  const scored = matches.filter((m) => m.score).length;
  const direct = matches.filter((m) => m.scoreSource === "exact_score").length;
  const derived = matches.filter((m) => m.scoreSource === "totals_ladder").length;
  console.log(`  matches with a 90-min result   : ${resolved}/${matches.length}`);
  console.log(`  matches with a score           : ${scored}/${matches.length}  (${direct} exact, ${derived} derived from O/U)`);
  console.log(`  knockouts with an advancer     : ${koAdv}/${ko.length}`);
  console.log(`  title-race teams with history  : ${withHist.length}/${titleRace.length}`);
  console.log(`  …of which genuinely traded     : ${tradeable.length} (rest pinned at 0.50, excluded from analysis)`);
  if (champion) console.log(`  champion curve points          : ${champion.points}`);
  if (withHist.length < titleRace.length * 0.5 || (champion && champion.points < 100)) {
    console.log("  ⚠ history looks sparse — likely network drops. Re-run to fill in.");
  }
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
