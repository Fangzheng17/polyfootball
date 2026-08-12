# Live stats 重做（Option C：纯 Polymarket 正确简化版）

日期：2026-06-17
状态：已与用户确认，准备实现

## 背景 / 根因（已查实）
官网详情页「Live stats」切换加载的是 **Sportradar「LMT Plus」嵌入 widget**
（`widgets.sir.sportradar.com` → `chunk.match.lmtPlus`），数据全部来自
`lmt.fn.sportradar.com/.../gismo/match_info|match_timeline|match_timelinedelta/<id>`，
其中 `<id>` = Gamma `eventMetadata.sportradarGameId`（`sr:sport_event:66457030` → `66457030`）。

每个数据请求带签名 token，payload `act:"origincheck", o:"https://polymarket.com"`，
绑定 Polymarket 自己的 client ID `357f35d2f90c86f7c3cc9b4771937688`，
**数据被锁死在 polymarket.com origin，无法盗用**。Polymarket 自身 Gamma/CLOB
接口里**没有**时间轴/阵容/裁判/教练/倒计时数据。

→ 真要复刻官网需自己注册 Sportradar widget client ID（授权本域名，LMT 多为付费/试用）。
本次先做 **Option C**（纯 Polymarket，正确不出错），并预留升级到 A 的接缝。

## 目标
1. 把「实时数据」面板的**状态机和取数做对**，永远不显示错误数据。
2. 手机优先、紧凑、像官网风格，复用现有 `.ls-*` 样式。
3. 顺手预留 A 升级接缝（后端透出 `sportradarGameId`；前端面板渲染包成可替换函数 + 开关）。

## 原始字段形态（实测）
- 赛前 PRE：`live/ended/closed` 皆 falsy，`score/period/elapsed` undefined。
- 进行中 LIVE：`live=true`，`period`∈`1H/2H/HT/ET/AET/P/PEN`，`elapsed`=分钟。
- 完场：`live=false, ended=true, closed=true, score="3-1", period="VFT", elapsed=""`。
  （完场是 **VFT** 不是 FT；状态判定以 `ended/closed` 为准，不依赖 period 拼写。）

## 状态机
显式推导单一状态（不靠 score 字符串猜 started）：
- **ENDED**：`ended===true` 或 (`closed===true` 且有比分) → 徽章「全场结束」，终场比分 + 胜方/平局文字，隐藏概率条。
- **LIVE**：`live===true` 且非 ENDED，按 period 细分徽章：
  - `1H`→「上半场 {elapsed}」、`2H`→「下半场 {elapsed}」（红 live）
  - `HT`→「中场休息」（灰）
  - `ET/AET`→「加时赛 {elapsed}」、`P/PEN`→「点球大战」（红 live）
  - 其它 live → 「进行中 {elapsed}」
  主体：大比分 + 胜平负概率条（实时 moneyline）。
- **PRE**：其它 → 徽章「未开赛」，主体：**Kickoff 倒计时（天/时/分/秒，每秒跳）** + 开赛时间 + 胜平负概率条。

## 取数修正
- **概率条不再依赖 `teamShort` 映射**（旧 bug 源）。对每个 `type==="moneyline"` 市场直接分类：
  标题含 `平局/draw`→平局；否则按 `home`/`away` 的 `nameZh|name|abbr` 匹配归类。
- ENDED 不取 moneyline（已结算为 1/0），直接用 `score` + 胜负判断。

## 展示（复用 `.ls-badge/.ls-score/.ls-team/.ls-nums/.ls-prob*`，新增 `.ls-countdown`）
- 通用：状态徽章 +「队旗+队名 ｜ 中间 ｜ 队旗+队名」。
- 中间：PRE=倒计时方块；LIVE/ENDED=大比分。
- 概率条：PRE/LIVE 显示；ENDED 隐藏。

## 刷新
- 数据：复用现有 `setInterval(loadMarkets, 15000)`；在 `render()` 末尾，若当前在 live tab 则 `renderLiveStats(latestData)`。
- 倒计时：独立 1s `setInterval`，只更新数字；切走 tab / 重渲染 / 非 PRE 时清除，避免叠加。

## A 升级接缝（本次只留缝，不接 widget）
- 后端 `lib/polymarket.mjs`：详情 `event` 增加 `sportradarGameId`（从 `eventMetadata` 取数字部分）。
- 前端：常量 `SR_WIDGET_CLIENT_ID=""`（空=禁用）。`renderLiveStats` 内：
  若 `SR_WIDGET_CLIENT_ID && event.sportradarGameId` → 挂载 Sportradar LMT（`mountSportradarLMT` 桩，注释写明 loader）；否则走 C 面板。

## 改动范围
- `lib/polymarket.mjs`：+`sportradarMatchId()` 辅助 + event 加 `sportradarGameId` 字段。
- `public/index.html`：重写 `renderLiveStats`；加倒计时与计时器管理；少量 CSS（`.ls-countdown`）；`render()` 末尾刷新 live 面板；加 SR 接缝常量与桩。
- `server.mjs` / `api/*` 不动。

## 验证
- 本地 `node server.mjs`（8787，改 lib 后**完全重启**）。
- 赛前态：`fifwc-prt-cdr-2026-06-17`（看倒计时）。
- 完场态：`fifwc-fra-sen-2026-06-16`（3-1，看终场比分+胜方）。
- 移动端：preview 移动视口 + eval 读 getComputedStyle（`preview_screenshot` 本项目会超时，用浏览器 MCP 截图）。
- 线上：`npx vercel --prod --yes`，手机 `?v=时间戳` 强刷。

## 非目标
- 不做时间轴/首发阵容/裁判/教练（数据不在 Polymarket）。
- 不加空时间轴进度条（无事件数据会像坏了）。
- 不实际接入 Sportradar widget（等用户提供 client ID）。
