# 实时足球 + 赔率落库

## 为什么要落库

**比赛一结束，Polymarket 会永久删除该场的赔率历史。** 这在 WC2026 上实测确认：
每一场打完的比赛，CLOB `prices-history` 都返回 0 个点。只有长期期货（如夺冠盘）
保留完整历史。

也就是说：**「赛前赔率 → 实际结果」这种逐场校准数据，事后永远补不回来**，
只能在比赛还开着的时候抓下来。这就是 odds-logger 的全部意义。

## 数据源

Polymarket 给每场足球赛打 tag **`100350` (Soccer)**，具体联赛用 **series** 表达
（europa-conference-league、la-liga-2025、soccer-lec…）。所以扫一个 tag 就等于
镜像了它整个足球板块——实测 **390 场 / 43 个联赛**，新联赛开赛会自动出现，
不需要维护联赛白名单。

> **坑**：`/events/keyset` 每页最多 100 条，**必须跟 `next_cursor` 翻页**。
> 不翻页只会拿到一个联赛（我第一次就只看到 Leagues Cup 18 场，以为就这么多）。

## 用法

```bash
npm run odds:once      # 跑一次（适合挂 Windows 计划任务 / cron）
npm run odds:log       # 常驻，默认每 5 分钟一轮
npm run odds:stats     # 看已经攒了多少数据
```

常用参数：

```bash
node scripts/odds-logger.mjs --interval=60     # 自定义轮询秒数
node scripts/odds-logger.mjs --days=3          # 只看未来 3 天的比赛
node scripts/odds-logger.mjs --all-markets     # 连角球/球员盘也记（日志大很多）
node scripts/odds-stats.mjs --match=<slug>     # 看某场的赔率变化路径
```

## 存储格式

`data/odds-log/YYYY-MM-DD.jsonl` —— 追加写，一行一个 JSON，崩了不会坏档。

- `kind:"meta"` —— 每场每天写一次：对阵、开球时间、联赛、队标/队色/缩写
- `kind:"price"` —— 一次真实的价格变动：`ts, slug, market, type, group, outcome, price`
  ，外加当时的 `live / ended / score / period`

**只记变动**：轮询时价格没变就不写。实测第二轮 1306 个价格里只有 173 个真变了——
不做这个去重，日志会被重复行淹没。

去重状态存在 `data/odds-log/.last-prices.json`，删掉它会导致下一轮把所有价格
当成「新变动」重记一遍（不会丢数据，只是多冗余行）。

## 建议：挂成后台任务

Windows 计划任务，每 5 分钟跑一次 `npm run odds:once`（比常驻进程更抗重启）：

```powershell
schtasks /create /tn "PolymarketOddsLogger" /tr "cmd /c cd /d C:\Users\fz\Documents\FIFA2026 && npm run odds:once" /sc minute /mo 5
```

赛前几小时和比赛进行中赔率变化最剧烈，值得保证那段时间机器是开着的。

## 前端改动

- `lib/polymarket.mjs`：`fetchFixtures` 从「世界杯单一 series」改为「Soccer tag
  全量翻页」。设环境变量 `WC_SERIES_ID` 可切回单一 series（世界杯存档模式）。
- fixture 增加 `league` 字段；首页卡片显示联赛标签（40+ 联赛，不标就认不出球队）。
- 详情页空分类（角球/球员等）自动隐藏——小联赛没有这些盘口，不然一排「0」。

世界杯详情页那套（胜平负 / 准确比分 / 上下半场 / 走势图 / combo）**对俱乐部比赛
直接复用，无需改动**，实测正常。
