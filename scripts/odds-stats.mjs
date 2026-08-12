// Summarise what the odds logger has captured so far.
//   node scripts/odds-stats.mjs            # all days
//   node scripts/odds-stats.mjs 2026-08-11 # one day
//   node scripts/odds-stats.mjs --match=lec-clt-pac-2026-08-11   # one match's path

import { readdir, readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "data", "odds-log");

const matchArg = (process.argv.find((a) => a.startsWith("--match=")) || "").split("=")[1];
const dayArg = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

async function readLog() {
  // Past days are stored gzipped; today's file is still plain text.
  let files = (await readdir(LOG_DIR)).filter((f) => f.endsWith(".jsonl") || f.endsWith(".jsonl.gz")).sort();
  if (dayArg) files = files.filter((f) => f.startsWith(dayArg));
  const rows = [];
  for (const f of files) {
    const buf = await readFile(path.join(LOG_DIR, f));
    const text = f.endsWith(".gz") ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); } catch {}
    }
  }
  return { files, rows };
}

const hhmm = (ts) => new Date(ts * 1000).toISOString().slice(11, 16);

async function main() {
  const { files, rows } = await readLog();
  if (!rows.length) { console.log("No log data yet. Run: npm run odds:once"); return; }

  const meta = rows.filter((r) => r.kind === "meta");
  const price = rows.filter((r) => r.kind === "price");
  const byMatch = new Map();
  for (const m of meta) if (!byMatch.has(m.slug)) byMatch.set(m.slug, m);

  // Single-match drill-down: show the odds path, which is the whole point of
  // logging — this is the data Polymarket deletes once a match ends.
  if (matchArg) {
    const info = byMatch.get(matchArg);
    console.log(info ? `${info.title}   kickoff ${info.kickoff || "?"}` : matchArg);
    const ml = price.filter((p) => p.slug === matchArg && p.type === "moneyline" && p.outcome === "Yes");
    const sides = [...new Set(ml.map((p) => p.group))];
    for (const side of sides) {
      const pts = ml.filter((p) => p.group === side).sort((a, b) => a.ts - b.ts);
      console.log(`\n  ${side}`);
      console.log("    " + pts.map((p) => `${hhmm(p.ts)} ${(p.price * 100).toFixed(1)}%`).join("  →  "));
    }
    return;
  }

  const moves = new Map();
  for (const p of price) {
    const k = `${p.slug}|${p.market}|${p.outcome}`;
    moves.set(k, (moves.get(k) || 0) + 1);
  }
  const tracked = [...byMatch.values()];
  const leagues = {};
  tracked.forEach((m) => {
    const l = (m.series || []).map((s) => s.title).join("/") || "-";
    leagues[l] = (leagues[l] || 0) + 1;
  });
  const withMoves = new Map();
  price.forEach((p) => withMoves.set(p.slug, (withMoves.get(p.slug) || 0) + 1));
  const busiest = [...withMoves.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  console.log(`files        : ${files.length}  (${files[0]} … ${files[files.length - 1]})`);
  console.log(`matches      : ${byMatch.size}`);
  console.log(`price points : ${price.length}`);
  console.log(`leagues      : ${Object.keys(leagues).length}`);
  const span = price.length ? `${hhmm(Math.min(...price.map((p) => p.ts)))} → ${hhmm(Math.max(...price.map((p) => p.ts)))}` : "-";
  console.log(`time span    : ${span} (UTC)`);

  console.log("\ntop leagues by matches tracked:");
  Object.entries(leagues).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .forEach(([l, n]) => console.log(`  ${String(n).padStart(3)}  ${l}`));

  console.log("\nmost price movement:");
  busiest.forEach(([slug, n]) => {
    const info = byMatch.get(slug);
    console.log(`  ${String(n).padStart(4)} pts  ${(info?.title || slug).slice(0, 48)}`);
  });
  console.log(`\nDrill into one:  node scripts/odds-stats.mjs --match=${busiest[0]?.[0] || "<slug>"}`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
