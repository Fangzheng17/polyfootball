// Odds logger — snapshots live Polymarket soccer odds to disk over time.
//
// WHY THIS EXISTS: once a match closes, Polymarket purges its CLOB price
// history (verified on WC2026 — every finished match returns 0 points). So
// per-match odds-over-time can NEVER be recovered after the fact. The only way
// to own that dataset is to capture it while matches are still open. That is
// what this does.
//
// Output: data/odds-log/YYYY-MM-DD.jsonl — append-only, one JSON object per
// line, safe to tail/resume/crash. Only CHANGED prices are written (a full
// snapshot every poll would be mostly duplicate rows), so each line is a real
// price move. A `kind:"meta"` line records each match's identity once.
//
// Usage:
//   node scripts/odds-logger.mjs              # run forever, poll every 5 min
//   node scripts/odds-logger.mjs --once       # single pass (for cron/Task Scheduler)
//   node scripts/odds-logger.mjs --interval=60  # custom seconds
//   node scripts/odds-logger.mjs --all-markets  # log every market, not just moneyline

import { appendFile, mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOCCER_TAG_IDS, LOG_ALL_MARKET_TYPES } from "./soccer-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "data", "odds-log");
const STATE_FILE = path.join(LOG_DIR, ".last-prices.json");
const GAMMA = "https://gamma-api.polymarket.com";

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : dflt;
};
const has = (name) => process.argv.includes(`--${name}`);

const ONCE = has("once");
const ALL_MARKETS = has("all-markets");
const INTERVAL_S = Number(arg("interval", 300));
const LOOKAHEAD_DAYS = Number(arg("days", 7));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const parse = (s) => { try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; } };

async function gj(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await fetch(url, { signal: ac.signal });
      clearTimeout(t);
      if (r.ok) return await r.json();
    } catch { clearTimeout(t); }
    await sleep(500 * (i + 1));
  }
  return null;
}

const isMatch = (e) => / vs\.? /i.test(e?.title || "") &&
  (e.markets || []).some((m) => m.sportsMarketType === "moneyline");

// Collect open soccer matches inside the lookahead window, across all
// configured tags (Polymarket splits leagues across tags/series).
async function upcomingMatches() {
  const now = Date.now();
  const min = new Date(now - 4 * 3600e3).toISOString();     // include in-play
  const max = new Date(now + LOOKAHEAD_DAYS * 24 * 3600e3).toISOString();
  const found = new Map();
  for (const tagId of SOCCER_TAG_IDS) {
    // keyset caps at 100/page — must follow next_cursor, otherwise only the
    // first competition comes back and most of the slate is silently missed.
    let cursor = null;
    for (let page = 0; page < 25; page++) {
      const p = new URLSearchParams({
        tag_id: String(tagId), related_tags: "true", closed: "false",
        end_date_min: min, end_date_max: max, limit: "100",
      });
      if (cursor) p.set("after_cursor", cursor);
      const r = await gj(`${GAMMA}/events/keyset?${p}`);
      const evs = r?.events || [];
      for (const e of evs) if (isMatch(e) && !found.has(e.slug)) found.set(e.slug, e);
      if (!r?.next_cursor || r.next_cursor === cursor || !evs.length) break;
      cursor = r.next_cursor;
      await sleep(120);
    }
  }
  return [...found.values()];
}

// Pull the full market set for a match (parent + child events), mirroring how
// the dashboard reads a match, so props/corners/etc. can be logged too.
async function marketsFor(ev) {
  if (!ALL_MARKETS && !LOG_ALL_MARKET_TYPES) return ev.markets || [];
  const kids = await gj(`${GAMMA}/events/keyset?parent_event_id=${ev.id}&include_children=true&limit=500`);
  const all = [...(ev.markets || [])];
  const seen = new Set(all.map((m) => m.slug));
  for (const child of (kids?.events || [])) {
    for (const m of (child.markets || [])) {
      if (!seen.has(m.slug)) { seen.add(m.slug); all.push(m); }
    }
  }
  return all;
}

async function loadState() {
  try { return JSON.parse(await readFile(STATE_FILE, "utf8")); } catch { return {}; }
}

async function pass(state) {
  const ts = Math.floor(Date.now() / 1000);
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(LOG_DIR, `${day}.jsonl`);
  const matches = await upcomingMatches();

  const lines = [];
  const seenKeys = new Set();
  let changed = 0, tracked = 0;

  for (const ev of matches) {
    // Identity line, written once per match per day, so the log is
    // self-describing without needing to re-query later.
    const metaKey = `meta:${day}:${ev.slug}`;
    if (!state[metaKey]) {
      state[metaKey] = 1;
      lines.push(JSON.stringify({
        kind: "meta", ts, slug: ev.slug, title: ev.title,
        kickoff: ev.endDate || ev.startDate || null,
        series: (ev.series || []).map((s) => ({ id: s.id, title: s.title || s.slug })),
        teams: (ev.teams || []).map((t) => ({
          name: t.name, abbr: t.abbreviation || "", logo: t.logo || null,
          color: t.color || null, ordering: t.ordering || null,
        })),
      }));
    }

    for (const m of await marketsFor(ev)) {
      if (m.closed || m.archived) continue;
      const outs = parse(m.outcomes) || [];
      const prices = (parse(m.outcomePrices) || []).map(Number);
      if (!outs.length || outs.length !== prices.length) continue;

      outs.forEach((outcome, i) => {
        const price = prices[i];
        if (!Number.isFinite(price)) return;
        tracked++;
        const key = `${m.slug}|${outcome}`;
        seenKeys.add(key);
        // Only record real moves — a poll where nothing traded should not
        // bloat the log with identical rows.
        if (state[key] === price) return;
        state[key] = price;
        changed++;
        lines.push(JSON.stringify({
          kind: "price", ts, slug: ev.slug, market: m.slug,
          type: m.sportsMarketType || "", group: m.groupItemTitle || "",
          outcome, price,
          live: Boolean(ev.live), ended: Boolean(ev.ended),
          score: ev.score || "", period: ev.period || "",
        }));
      });
    }
  }

  if (lines.length) await appendFile(file, lines.join("\n") + "\n", "utf8");

  // Prune the dedup state, otherwise it grows forever: price keys for finished
  // matches and meta keys from previous days would accumulate indefinitely.
  // Anything not seen in this pass belongs to a match that has left the window.
  const keep = {};
  for (const k of seenKeys) keep[k] = state[k];
  for (const k of Object.keys(state)) {
    if (k.startsWith(`meta:${day}:`)) keep[k] = state[k]; // today's meta lines
  }
  for (const k of Object.keys(state)) if (!(k in keep)) delete state[k];
  Object.assign(state, keep);

  await writeFile(STATE_FILE, JSON.stringify(state), "utf8");
  const stamp = new Date().toISOString().slice(11, 19);
  console.log(`[${stamp}] matches:${matches.length} tracked:${tracked} changed:${changed} -> ${path.basename(file)}`);
  return { matches: matches.length, changed };
}

// JSONL compresses ~92%, so finished days are gzipped to keep the repo small
// (2.4GB/yr raw vs ~290MB/yr gzipped). Today's file stays plain for appending.
async function compressFinishedDays() {
  const today = new Date().toISOString().slice(0, 10);
  let files;
  try { files = await readdir(LOG_DIR); } catch { return; }
  for (const f of files) {
    if (!f.endsWith(".jsonl") || f.startsWith(today)) continue;
    const src = path.join(LOG_DIR, f);
    try {
      await pipeline(createReadStream(src), createGzip(), createWriteStream(src + ".gz"));
      await rm(src);
      console.log(`  compressed ${f} -> ${f}.gz`);
    } catch (e) { console.error(`  compress ${f} failed:`, e.message); }
  }
}

async function main() {
  await mkdir(LOG_DIR, { recursive: true });
  await compressFinishedDays();
  if (!SOCCER_TAG_IDS.length) {
    console.error("No SOCCER_TAG_IDS configured. Run: node scripts/discover-soccer.mjs");
    process.exit(1);
  }
  const state = await loadState();
  console.log(`odds-logger | tags:[${SOCCER_TAG_IDS.join(",")}] | ${ONCE ? "single pass" : `every ${INTERVAL_S}s`}`
    + ` | ${(ALL_MARKETS || LOG_ALL_MARKET_TYPES) ? "all markets" : "match markets only"}`);

  if (ONCE) { await pass(state); return; }
  for (;;) {
    try { await pass(state); }
    catch (e) { console.error("  pass failed:", e.message); }
    await sleep(INTERVAL_S * 1000);
  }
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
