import { writeFile, rm } from "node:fs/promises";
import path from "node:path";

const EVENT_SLUG = process.env.EVENT_SLUG || "fifwc-can-bih-2026-06-12";
const GAMMA_URL = process.env.GAMMA_URL || "https://gamma-api.polymarket.com";
const SITE_URL = `https://polymarket.com/sports/world-cup/${EVENT_SLUG}`;
const OUTPUT_HTML = process.env.OUTPUT_HTML || `${EVENT_SLUG}.html`;
const OUTPUT_DATA = process.env.OUTPUT_DATA || `${EVENT_SLUG}.json`;

const categories = [
  {
    id: "game-lines",
    label: "比赛盘口",
    types: ["moneyline", "spreads", "totals", "soccer_team_totals", "both_teams_to_score", "soccer_first_to_score"],
  },
  { id: "correct-score", label: "准确比分", types: ["soccer_exact_score", "correct_score"] },
  {
    id: "halves",
    label: "上下半场",
    types: [
      "soccer_halftime_result",
      "soccer_second_half_result",
      "first_half_totals",
      "second_half_totals",
      "both_teams_to_score_first_half",
      "both_teams_to_score_second_half",
      "soccer_first_half_team_totals",
      "soccer_second_half_team_totals",
    ],
  },
  {
    id: "corners",
    label: "角球",
    types: [
      "total_corners",
      "soccer_team_total_corners",
      "soccer_first_corner",
      "soccer_game_corners_odd_even",
      "soccer_first_half_total_corners",
      "soccer_second_half_total_corners",
    ],
  },
  { id: "goals", label: "进球", types: ["soccer_player_goals"] },
  { id: "assists", label: "助攻", types: ["soccer_player_assists"] },
  { id: "shots", label: "射门", types: ["soccer_player_shots"] },
];

const typeToCategory = new Map(categories.flatMap((category) => category.types.map((type) => [type, category.id])));
const displayMarketTypes = new Set(typeToCategory.keys());
const typeLabel = {
  moneyline: "胜平负",
  spreads: "让球",
  totals: "总进球",
  soccer_team_totals: "球队进球",
  both_teams_to_score: "双方进球",
  soccer_first_to_score: "先进球",
  soccer_exact_score: "准确比分",
  soccer_halftime_result: "半场结果",
  soccer_second_half_result: "下半场结果",
  first_half_totals: "上半场总进球",
  second_half_totals: "下半场总进球",
  both_teams_to_score_first_half: "上半场双方进球",
  both_teams_to_score_second_half: "下半场双方进球",
  soccer_first_half_team_totals: "上半场球队进球",
  soccer_second_half_team_totals: "下半场球队进球",
  total_corners: "总角球",
  soccer_team_total_corners: "球队角球",
  soccer_first_corner: "首个角球",
  soccer_game_corners_odd_even: "角球单双",
  soccer_first_half_total_corners: "上半场角球",
  soccer_second_half_total_corners: "下半场角球",
  soccer_player_goals: "球员进球",
  soccer_player_assists: "球员助攻",
  soccer_player_shots: "球员射门",
  soccer_player_shots_on_target: "射正",
};

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0 PolymarketDashboard/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}`);
  }
  return response.json();
}

function isDisplayMarket(market) {
  return displayMarketTypes.has(market.sportsMarketType || "unknown") && !market.archived;
}

function mergeEventMarkets(events) {
  const seen = new Set();
  const markets = [];
  for (const event of events) {
    for (const market of event.markets || []) {
      if (!isDisplayMarket(market)) continue;
      const key = market.slug || market.conditionId || market.id;
      if (seen.has(key)) continue;
      seen.add(key);
      markets.push(market);
    }
  }
  return markets;
}

async function fetchSportsEvent(slug) {
  const parent = await fetchJson(`${GAMMA_URL}/events/slug/${encodeURIComponent(slug)}?locale=zh`);
  if (!parent?.id) throw new Error(`Could not find Polymarket event for slug: ${slug}`);
  const childParams = new URLSearchParams({
    parent_event_id: String(parent.id),
    include_children: "true",
    limit: "500",
    locale: "zh",
  });
  const children = await fetchJson(`${GAMMA_URL}/events/keyset?${childParams.toString()}`);
  const events = Array.isArray(children.events) && children.events.length ? children.events : [parent];
  return {
    ...parent,
    markets: mergeEventMarkets(events),
    childEventIds: events.filter((event) => String(event.id) !== String(parent.id)).map((event) => String(event.id)),
  };
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function number(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatCent(value) {
  const n = number(value);
  if (n == null) return "-";
  const cents = n * 100;
  const text = cents >= 10 ? cents.toFixed(1) : cents.toFixed(2);
  return `${text.replace(/\.?0+$/, "")}¢`;
}

function fmtNum(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function fmtDate(value, timeZone) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function translate(value) {
  return String(value ?? "")
    .replaceAll("Bosnia and Herzegovina", "波黑")
    .replaceAll("Bosnia-Herzegovina", "波黑")
    .replaceAll("波斯尼亚和黑塞哥维那", "波黑")
    .replaceAll("Canada", "加拿大")
    .replaceAll("France", "法国")
    .replaceAll("Senegal", "塞内加尔")
    .replaceAll("Draw", "平局")
    .replaceAll("Any Other Score", "其他比分")
    .replaceAll("Neither", "均无")
    .replaceAll("Yes", "是")
    .replaceAll("No", "否")
    .replaceAll("Over", "大")
    .replaceAll("Under", "小")
    .replaceAll("O/U", "大小")
    .replaceAll("Total Corners", "总角球")
    .replaceAll("Exact Score", "准确比分")
    .replaceAll("Spread", "让球")
    .replaceAll("Both Teams to Score", "双方进球")
    .replaceAll("to score first", "先进球")
    .replaceAll("First Half", "上半场")
    .replaceAll("Second Half", "下半场");
}

function marketTitle(market) {
  return translate(market.groupItemTitle || market.question || market.slug);
}

function normalizeMarket(market) {
  const outcomes = parseList(market.outcomes);
  const prices = parseList(market.outcomePrices);
  return {
    id: String(market.id),
    slug: market.slug,
    question: translate(market.question),
    title: marketTitle(market),
    type: market.sportsMarketType || "unknown",
    typeLabel: typeLabel[market.sportsMarketType] || market.sportsMarketType || "其他",
    categoryId: typeToCategory.get(market.sportsMarketType) || "other",
    active: Boolean(market.active),
    closed: Boolean(market.closed),
    outcomes: outcomes.map((outcome, index) => ({
      label: translate(outcome),
      price: number(prices[index]),
      priceText: formatCent(prices[index]),
    })),
  };
}

function sortMarkets(a, b) {
  const typeCompare = String(a.typeLabel).localeCompare(String(b.typeLabel), "zh-CN");
  if (typeCompare) return typeCompare;
  return String(a.title).localeCompare(String(b.title), "zh-CN", { numeric: true });
}

function renderMarketCard(market) {
  const outcomeHtml = market.outcomes
    .map((outcome) => `<span class="outcome"><b>${htmlEscape(outcome.label)}</b><strong>${htmlEscape(outcome.priceText)}</strong></span>`)
    .join("");
  return `<article class="market-card">
    <div class="market-top">
      <span>${htmlEscape(market.typeLabel)}</span>
      ${market.closed ? "<em>已关闭</em>" : "<em>开放</em>"}
    </div>
    <h3>${htmlEscape(market.title)}</h3>
    <p>${htmlEscape(market.question)}</p>
    <div class="outcomes">${outcomeHtml}</div>
  </article>`;
}

function renderSection(category, markets) {
  const list = markets.filter((market) => market.categoryId === category.id).sort(sortMarkets);
  const cards = list.map(renderMarketCard).join("");
  return `<section class="market-section" id="${category.id}">
    <div class="section-head">
      <h2>${htmlEscape(category.label)}</h2>
      <span>${list.length} 个盘口</span>
    </div>
    <div class="market-grid">${cards}</div>
  </section>`;
}

function renderDashboard(data) {
  const nav = categories
    .map((category) => {
      const count = data.markets.filter((market) => market.categoryId === category.id).length;
      return `<a href="#${category.id}">${htmlEscape(category.label)}<span>${count}</span></a>`;
    })
    .join("");
  const sections = categories.map((category) => renderSection(category, data.markets)).join("");
  const embeddedJson = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Polymarket 加拿大 vs 波黑全部盘口</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --ink: #161d26;
      --muted: #728092;
      --line: #dfe5ec;
      --line-soft: #edf1f5;
      --blue: #1652f0;
      --green: #147d55;
      --shadow: 0 14px 34px rgba(25, 35, 55, 0.07);
      font-family: "Inter", "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      letter-spacing: 0;
    }
    .shell {
      width: min(1480px, calc(100vw - 40px));
      margin: 0 auto;
      padding: 28px 0 42px;
    }
    header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 24px;
      align-items: end;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(30px, 4vw, 48px);
      line-height: 1.05;
      font-weight: 820;
    }
    p {
      margin: 0;
      color: var(--muted);
      line-height: 1.5;
    }
    .source-link {
      color: var(--blue);
      text-decoration: none;
      font-weight: 700;
    }
    .status {
      display: inline-grid;
      gap: 6px;
      padding: 10px 12px;
      border: 1px solid #bdd8c8;
      color: #0b6b45;
      background: #effaf4;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      white-space: nowrap;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin: 18px 0;
    }
    .summary-card,
    .market-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .summary-card {
      padding: 15px;
      min-height: 92px;
    }
    .summary-card span,
    .market-top,
    .section-head span {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
    }
    .summary-card b {
      display: block;
      margin-top: 9px;
      font-size: 22px;
      line-height: 1.1;
    }
    .note {
      background: #eef4ff;
      border: 1px solid #d7e5ff;
      border-radius: 8px;
      color: #31516f;
      padding: 12px 14px;
      line-height: 1.55;
      font-size: 13px;
      margin-bottom: 18px;
    }
    .tabs {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      gap: 22px;
      align-items: center;
      overflow-x: auto;
      padding: 15px 2px;
      margin: 0 0 10px;
      background: rgba(246, 247, 249, 0.94);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--line);
    }
    .tabs a {
      color: #7b8798;
      text-decoration: none;
      font-size: clamp(18px, 2.4vw, 30px);
      line-height: 1;
      font-weight: 820;
      white-space: nowrap;
    }
    .tabs a:first-child { color: var(--ink); }
    .tabs span {
      display: inline-block;
      margin-left: 6px;
      color: var(--muted);
      font-size: 12px;
      vertical-align: super;
    }
    .market-section {
      scroll-margin-top: 92px;
      margin-top: 22px;
    }
    .section-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 12px;
    }
    h2 {
      margin: 0;
      font-size: 22px;
      line-height: 1.2;
    }
    .market-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .market-card {
      padding: 14px;
      min-height: 178px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .market-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .market-top em {
      color: var(--green);
      font-style: normal;
      font-weight: 800;
    }
    .market-card h3 {
      margin: 0;
      font-size: 17px;
      line-height: 1.25;
    }
    .market-card p {
      min-height: 36px;
      font-size: 12px;
    }
    .outcomes {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-top: auto;
    }
    .outcome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 42px;
      padding: 9px 10px;
      background: #f7f9fc;
      border: 1px solid var(--line-soft);
      border-radius: 8px;
      font-variant-numeric: tabular-nums;
    }
    .outcome b {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 750;
    }
    .outcome strong {
      color: var(--blue);
      font-size: 17px;
    }
    footer {
      margin-top: 28px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.6;
    }
    @media (max-width: 1120px) {
      .market-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .shell { width: min(100vw - 24px, 680px); padding-top: 18px; }
      header { grid-template-columns: 1fr; }
      .summary,
      .market-grid { grid-template-columns: 1fr; }
      .tabs { gap: 18px; }
      .tabs a { font-size: 22px; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div>
        <h1>${htmlEscape(data.event.title)} 全部盘口</h1>
        <p>Polymarket: <a class="source-link" href="${htmlEscape(SITE_URL)}">${htmlEscape(EVENT_SLUG)}</a></p>
      </div>
      <div class="status">
        <span>${data.event.active && !data.event.closed ? "Active / 开放" : "Closed / 已关闭"}</span>
        <span>${fmtNum(data.totalMarkets)} 个盘口</span>
      </div>
    </header>

    <section class="summary">
      <div class="summary-card"><span>比赛时间 北京</span><b>${fmtDate(data.event.endDate, "Asia/Shanghai")}</b></div>
      <div class="summary-card"><span>抓取时间 北京</span><b>${fmtDate(data.snapshotAt, "Asia/Shanghai")}</b></div>
      <div class="summary-card"><span>Polymarket 更新时间</span><b>${fmtDate(data.event.updatedAt, "Asia/Shanghai")}</b></div>
      <div class="summary-card"><span>数据字段</span><b>仅盘口价格</b></div>
    </section>

    <div class="note">已按你给的分类展示所有 Polymarket 盘口；每个盘口只展示当前价格。</div>
    <nav class="tabs" aria-label="盘口分类">${nav}</nav>
    ${sections}

    <footer>数据来自 Polymarket Gamma API。价格为 outcome 当前价格，单位为美分，约等于隐含概率；本页仅作数据展示，不构成交易建议。</footer>
  </main>
  <script type="application/json" id="dashboard-data">${embeddedJson}</script>
</body>
</html>`;
}

async function main() {
  const event = await fetchSportsEvent(EVENT_SLUG);
  const markets = event.markets.map(normalizeMarket);
  const knownCategoryIds = new Set(categories.map((category) => category.id));
  const uncategorized = markets.filter((market) => !knownCategoryIds.has(market.categoryId));
  if (uncategorized.length) {
    throw new Error(`Uncategorized market types: ${[...new Set(uncategorized.map((market) => market.type))].join(", ")}`);
  }

  const data = {
    snapshotAt: new Date().toISOString(),
    source: `${GAMMA_URL}/events/slug/${EVENT_SLUG} + ${GAMMA_URL}/events/keyset?parent_event_id=${event.id}&include_children=true`,
    totalMarkets: markets.length,
    categories: categories.map((category) => ({
      id: category.id,
      label: category.label,
      count: markets.filter((market) => market.categoryId === category.id).length,
    })),
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      active: Boolean(event.active),
      closed: Boolean(event.closed),
      endDate: event.endDate,
      updatedAt: event.updatedAt,
      gameId: event.gameId,
      childEventIds: event.childEventIds,
    },
    markets,
  };

  await writeFile(OUTPUT_DATA, JSON.stringify(data, null, 2), "utf8");
  await writeFile(OUTPUT_HTML, renderDashboard(data), "utf8");

  await rm("polymarket-canada-bosnia-books.json", { force: true });
  await rm("polymarket-canada-bosnia-midpoints.json", { force: true });
  await rm("polymarket-canada-bosnia-last-trades.json", { force: true });
  await rm("polymarket-game-90086909-markets.json", { force: true });
  await rm("gamma-openapi.yaml", { force: true });
  await rm("polymarket-sports.json", { force: true });
  await rm("polymarket-sports-market-types.json", { force: true });

  console.log(JSON.stringify({
    html: path.resolve(OUTPUT_HTML),
    data: path.resolve(OUTPUT_DATA),
    totalMarkets: data.totalMarkets,
    categories: data.categories,
    snapshotAt: data.snapshotAt,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
