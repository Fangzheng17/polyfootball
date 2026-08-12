// Discover how Polymarket organises its soccer section, so the dashboard can
// mirror it instead of guessing league lists.
//
// Prints: candidate soccer tags (with live event counts), the series behind
// upcoming matches, and a sample of what a match event looks like. Paste the
// output back so the fixture layer can be wired to the real ids.

const GAMMA = "https://gamma-api.polymarket.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gj(url, tries = 4) {
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

const isMatch = (e) => / vs\.? /i.test(e?.title || "") &&
  (e.markets || []).some((m) => m.sportsMarketType === "moneyline");

async function main() {
  console.log("=".repeat(64));
  console.log("1) TAG SEARCH — which tags carry live soccer?");
  console.log("=".repeat(64));

  // Search surfaces tags alongside events; collect candidates.
  const seen = new Map();
  for (const q of ["soccer", "football", "premier league", "champions league",
                   "la liga", "serie a", "bundesliga", "ligue 1", "mls"]) {
    const s = await gj(`${GAMMA}/public-search?q=${encodeURIComponent(q)}&limit_per_type=10&events_status=active`);
    const tags = s?.tags || [];
    for (const t of tags) {
      if (!t?.id || seen.has(t.id)) continue;
      seen.set(t.id, { id: t.id, label: t.label || t.slug, slug: t.slug, via: q });
    }
    const evs = (s?.events || []).filter(isMatch);
    console.log(`  "${q}"`.padEnd(22), `tags:${String(tags.length).padStart(2)}  match-events:${evs.length}`);
    await sleep(120);
  }

  console.log("\n  candidate tags:");
  for (const t of seen.values()) {
    const r = await gj(`${GAMMA}/events/keyset?tag_id=${t.id}&related_tags=true&closed=false&limit=100`);
    const evs = r?.events || [];
    const matches = evs.filter(isMatch);
    const series = new Set();
    matches.forEach((e) => (e.series || []).forEach((s) => series.add(`${s.id}:${s.title || s.slug}`)));
    console.log(`    tag ${String(t.id).padEnd(7)} ${String(t.label).padEnd(26)} open:${String(evs.length).padStart(3)} matches:${String(matches.length).padStart(3)}`
      + (series.size ? `  series:[${[...series].slice(0, 4).join(", ")}]` : ""));
    await sleep(120);
  }

  console.log("\n" + "=".repeat(64));
  console.log("2) UPCOMING SOCCER MATCHES (next 14d, via tag sweep)");
  console.log("=".repeat(64));
  const now = Date.now();
  const min = new Date(now - 6 * 3600e3).toISOString();
  const max = new Date(now + 14 * 24 * 3600e3).toISOString();
  const found = new Map();
  for (const t of seen.values()) {
    const p = new URLSearchParams({
      tag_id: String(t.id), related_tags: "true", closed: "false",
      end_date_min: min, end_date_max: max, limit: "200",
    });
    const r = await gj(`${GAMMA}/events/keyset?${p}`);
    for (const e of (r?.events || [])) {
      if (!isMatch(e) || found.has(e.slug)) continue;
      found.set(e.slug, { slug: e.slug, title: e.title, date: (e.endDate || "").slice(0, 16),
        series: (e.series || []).map((s) => s.title || s.slug).join("/") || "-", tag: t.label });
    }
    await sleep(120);
  }
  const list = [...found.values()].sort((a, b) => a.date.localeCompare(b.date));
  console.log(`  total upcoming soccer matches: ${list.length}`);
  list.slice(0, 30).forEach((m) => console.log(`    ${m.date}  ${m.title.slice(0, 40).padEnd(42)} [${m.series}]`));
  if (list.length > 30) console.log(`    … and ${list.length - 30} more`);

  console.log("\n  series breakdown:");
  const bySeries = {};
  list.forEach((m) => { bySeries[m.series] = (bySeries[m.series] || 0) + 1; });
  Object.entries(bySeries).sort((a, b) => b[1] - a[1])
    .forEach(([s, n]) => console.log(`    ${String(n).padStart(3)}  ${s}`));

  console.log("\n" + "=".repeat(64));
  console.log("3) SAMPLE MATCH SHAPE");
  console.log("=".repeat(64));
  if (list.length) {
    const ev = await gj(`${GAMMA}/events/slug/${list[0].slug}`);
    if (ev) {
      const types = [...new Set((ev.markets || []).map((m) => m.sportsMarketType).filter(Boolean))];
      console.log(`  ${ev.title}`);
      console.log(`  seriesId : ${(ev.series || []).map((s) => s.id).join(",") || "-"}`);
      console.log(`  markets  : ${(ev.markets || []).length}  types: ${types.join(", ")}`);
      console.log(`  teams    : ${(ev.teams || []).map((t) => `${t.name}(${t.abbreviation || "?"}, ${t.color || "no-color"})`).join(" vs ") || "-"}`);
      console.log(`  has logo : ${(ev.teams || []).some((t) => t.logo)}`);
    }
  } else {
    console.log("  (no upcoming matches found — off-season; try widening the window)");
  }
  console.log("\nDone. Paste this output back.");
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
