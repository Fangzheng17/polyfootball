# 2026 世界杯地图页 · 3D 地球重做 设计文档

- 日期：2026-06-16
- 状态：待用户审阅
- 范围：仅地图页（`?tab=map`）的前端渲染、配色、排行榜，以及一处最小后端字段补充。
- 目标观感：对齐 Polymarket 官网 `https://polymarket.com/zh/sports/world-cup/map`，并在地球信息量上超过它。

## 1. 背景与问题

当前地图页（`public/index.html` 第 3415–3867 行）用 WebGL 球体着色器，采样两张程序化纹理：

- 陆地纹理 = 6 个手绘多边形近似大洲（`drawLandTexture`，行 3523）。
- 热区纹理 = 各国质心处的径向光晕（`createGlobeTextures`，行 3549）。

结果：大陆是模糊团块、概率是发光点，离"真实世界地图"差距明显，也不像官网。数据来自现有 `/api/prop-event?slug=world-cup-winner`（实时验证：48 队，前三 法国/西班牙/葡萄牙），该接口稳定，无需重做。

官网实测（2026-06-16 浏览器查看）：

- 地球是浅色"霜玻璃"球，近乎纯白、装饰性强，几乎看不到高亮国家。
- 真正的数据在右侧**排行榜**：真实国旗图 + 中文队名 + 淡紫进度条 + 蓝色饱和度随概率变化的百分比药丸。
- 桌面布局：地球左（约 60%）+ 排行榜右（约 40%）；标签 比赛/玩法/对阵图/地图。

结论：排行榜是"最像官网"的关键；地球做成霜玻璃 + 真实国家轮廓 + 整国高亮，即可在信息量上超过官网那个近乎空白的球。

## 2. 目标 / 非目标

目标：

- 真实国家轮廓的会动地球，参赛国按夺冠概率整国着色高亮（霜玻璃浅色 + 蓝色概率梯度）。
- 官网同款排行榜：真实国旗 + 队名 + 淡紫进度条 + 饱和度随概率变化的百分比药丸。
- 全部前端渲染，零额外服务器计算；地理数据为本站自带静态资源。
- 手机端优先：流畅、不卡、不横向溢出。
- 点击国家：高亮该国 + 弹出概率小卡 + 联动排行榜对应行（留在本站）。
- 把地球逻辑从 4367 行单文件抽成独立模块 `public/globe.js`。

非目标：

- 不动比赛页、玩法页、详情页、走势图。
- 不引入运行时大依赖（不加 d3/three.js/topojson 的 CDN 外链）。
- 不加登录、交易、下单、订单簿；不展示他人下注数据。
- 不重做后端数据归一化逻辑（仅补一个 image 字段）。
- 不做"对阵图"标签（单独排期，见 §14）。

## 3. 已锁定决策

| 项 | 决策 |
| --- | --- |
| 渲染方案 | A：Canvas2D 正射投影矢量地球（自写投影，不引 d3） |
| 地理精度 | 真实国家轮廓 + 参赛国整国按概率高亮 |
| 配色 | 霜玻璃·浅色，蓝色概率梯度 |
| 地理数据 | 内置 Natural Earth 110m 国界（TopoJSON ≈100KB，gzip ≈40KB），本站静态资源 |
| 国旗 | 真实国旗图（复用 Polymarket 市场图标），取不到时回退 CSS 渐变国旗 |
| 交互 | 点击国家 → 高亮 + 概率小卡 + 联动排行榜行 |
| 模块化 | 抽出 `public/globe.js`，单一职责、接口清晰 |
| 后端 | 最小改动：地图数据路径补 `image` 字段 |

## 4. 架构总览

```
/api/prop-event?slug=world-cup-winner        (现有接口 + 新增 image 字段)
        │  data.markets[]: { title(中文), image, outcomes[0].price(Yes), ... }
        ▼
public/index.html  loadMap()
        │  1) 归一化为 teams[]：{ cnName, prob, flagImg }
        │  2) 用 TEAM_GEO 把 cnName → ISO 数字 id
        ▼
   ┌──────────────────────────────┬───────────────────────────────┐
   ▼                              ▼
public/globe.js                  排行榜渲染（index.html 内）
 initGlobe(canvas,opts)           renderMapRank(teams)
   .update(teams)                  官网同款行：旗+名+进度条+药丸
 读取内置 countries-110m.json
 正射投影 + 半球裁剪 + 整国填色
 自转/拖拽/点击命中
```

数据流要点：

- 概率 = `markets[i].outcomes` 中 Yes 价格（沿用 `mapMarketPrice`，行 3487）。
- 地球与排行榜共享同一份 `teams[]`，确保高亮联动一致。
- 地理 JSON 由浏览器从本站 `/geo/countries-110m.json` 加载一次，解码后缓存于内存。

## 5. 地理数据

- 文件：`public/geo/countries-110m.json`，Natural Earth 1:110m admin-0（world-atlas 同款），TopoJSON 格式，约 100KB（gzip ≈40KB）。一次性加载，构建期落盘，运行期零服务器计算。
- 解码：内置一个最小 TopoJSON→GeoJSON 解码器（`feature`/弧线拼接，约 40–60 行，无第三方依赖），放在 `globe.js` 内。不引 topojson 库。
- 队名映射：新增单一事实源 `TEAM_GEO`（中文名 → `{ isoNum, enName }`，约 48 条，覆盖当前冠军盘口的参赛国）。`isoNum` 对齐 world-atlas 的数字 ISO（如 France=250）。
  - 复用现有 `englishTeamName`/`chineseTeamName`/`mapCountryCoords`（行 2955/2989/3415）作为对照，避免重复造表。
- 高亮匹配：`id → prob` 表由 `teams[]` 生成；绘制时所有国家先画浅灰底，命中 id 的国家用概率梯度填色。

## 6. 地球渲染（`public/globe.js`）

### 6.1 正射投影与可见半球裁剪

- 投影：正射（orthographic）。复用现有 `globePoint`（行 3593）的经纬度→球面→屏幕逻辑，扩展为对多边形环逐点投影。
- 关键难点：背面几何在正射下会镜像投影到同一圆盘，必须**剔除背面、裁剪跨越地平圈的环**。
  - 每个国家：全部顶点在前半球 → 直接填充；全部在背面 → 跳过；跨地平圈 → 对可见半球（大圆地平线）做 Sutherland–Hodgman 裁剪（约 50–80 行，等价于 d3 `clipAngle(90)` 的手写版）。
  - 风险与回退：若裁剪实现不稳，先退化为"仅画前半球顶点 + canvas 圆盘 clip"，接受球缘轻微毛刺（见 §13）。

### 6.2 霜玻璃视觉（浅色）

- 海洋/球体底：浅灰白径向明暗（高光偏左上），细描边球缘，轻微外发光 halo——对齐官网霜玻璃感。纯平涂 + 一层径向明暗，不用动画渐变。
- 陆地（未参赛国）：浅灰填充（约 `#d8dee8`），0.5px 更浅描边。
- 与现有页面变量统一（`--surface`/`--line` 等），保证融入。

### 6.3 概率高亮配色（蓝色梯度）

- 参赛国按 `prob` 用蓝色梯度填充（低→高：`#dce9f8 → #b5d4f4 → #6aa6e0 → #2f6fb8 → #16467e`，与排行榜药丸同色系）。
- 概率→色用分段或线性插值；`prob<1%` 也给最浅一档，确保可见。
- 选中/悬停国家：描边加深 + 轻微提亮，作为高亮反馈。

### 6.4 自转 / 拖拽 / 性能

- 自动慢速自转；拖拽旋转（复用现有 pointer 逻辑，行 3709–3731）。
- 暂停条件（复用现有）：`document.hidden` 或不在地图页（`activeHomeTab !== 'map'`）即停 `requestAnimationFrame`。
- 帧率：手机 ≤30fps（`innerWidth<=700` 时节流，复用行 3824–3828 思路），桌面 60fps。
- DPR 上限 2（复用 `drawWebGlGlobe` 的 ratio 处理，行 3739）。
- 性能预算：110m 已较粗；只画前半球；如手机仍卡，按序降级——降帧率→进一步简化几何→自转可暂停。

### 6.5 交互（点击国家）

- 命中：屏幕点 → 逆正射投影到经纬度 → 命中测试（`ctx.isPointInPath` 或点在多边形内）。
- 命中参赛国：高亮该国轮廓 + 在球边弹出小卡（国旗 + 中文名 + 概率%）+ 联动高亮右侧排行榜对应行并滚动到可见。
- 命中非参赛国或空白：清除高亮。
- 全部留在本站，不跳转 Polymarket。

## 7. 排行榜组件（官网同款）

替换现有 `renderMapRank`（行 3840）。每行结构（桌面与移动一致，移动端字号收紧）：

```
[国旗图 26×17] [中文名]            [██████ 淡紫进度条 ]   [ 18% 药丸 ]
```

- 国旗：真实国旗图 `<img>`（来自 `team.flagImg`），`onerror` 回退到现有 CSS 渐变国旗（`teamFlag`，行 3024）。
- 进度条：高 4px，圆角；轨道 `--surface-soft`，填充淡紫 `#aab8f0`；宽度按"相对榜首"缩放（`prob / maxProb`）。
- 百分比药丸：圆角 8px；蓝色背景**饱和度随概率变化**（高概率实蓝白字，低概率浅蓝深字）；阈值约：≥12% 实蓝白字、6–12% 中蓝白字、<6% 浅蓝深字。
- 百分比用整数 %（沿用 `mapPercent`，行 3475），不用美分。
- 整行可点 → 进入本站 `?view=prop&propSlug=world-cup-winner`（沿用现有行为）。
- 移动端：地球在上、排行榜在下（沿用 `.map-shell` 断点，行 2159）。

## 8. 后端最小改动

- 文件：`lib/polymarket.mjs`，函数 `serializePropEventMarket`（行 495）。
- 改动：返回对象新增 `image: market.icon || market.image || null`。
- 影响面：仅给 `/api/prop-event` 的每个市场带上图标 URL；其余字段不变，比赛/玩法页不受影响。
- 顺手清理（可选，低风险）：移除 `serializePropEvent` 里未被前端使用的 `url: https://polymarket.com/...`（行 487），避免外站链接隐患。

## 9. 降级与错误处理

- 地理 JSON 加载/解码失败：地球区域显示简化占位（保留球体底 + 提示），排行榜照常渲染（数据独立于地理）。
- 接口失败：沿用现有错误提示（行 4295）。
- 移除旧的 WebGL 着色器与 2D 双路径复杂度（`initGlobe`/`drawWebGlGlobe`/`drawFallbackGlobe`/着色器源串，行 3633–3803），统一为 Canvas2D 单实现 + 简化占位。

## 10. 模块接口（`public/globe.js`）

```js
// 单一职责：把 teams[] 渲染成可交互的霜玻璃地球
export function initGlobe(canvas, {
  onCountrySelect,   // (team|null) => void  点击国家回调（联动排行榜）
  isMobile,          // () => boolean        帧率/标签数量判断
  isActive,          // () => boolean        是否在地图页（暂停用）
}) {
  return {
    update(teams),   // teams: [{ cnName, prob, flagImg, isoNum }]
    selectCountry(isoNum|null),  // 外部（点排行榜）反向高亮地球
    destroy(),       // 取消 rAF、解绑事件
  };
}
```

- `index.html` 只负责：取数 → 归一化 teams → `globe.update(teams)` + 渲染排行榜；点击排行榜行时调 `globe.selectCountry`。
- `globe.js` 不直接 fetch 业务接口，只 fetch 自带地理 JSON；保持可独立理解与测试。

## 11. 改动文件清单

- 新增 `public/geo/countries-110m.json`：地理数据（构建期落盘）。
- 新增 `public/globe.js`：地球模块（投影、裁剪、填色、自转、拖拽、命中、TopoJSON 解码）。
- 改 `public/index.html`：
  - 移除旧地球相关代码（§9 所列）。
  - 引入 `globe.js`，`loadMap/renderMap` 改为归一化 teams 后驱动 `globe.update` + 新排行榜。
  - 新增排行榜行样式（国旗图/进度条/药丸）与移动端字号收紧。
- 改 `lib/polymarket.mjs`：`serializePropEventMarket` 加 `image` 字段（§8）。
- 静态服务：`server.mjs` 已支持 `.json`（行 39）与 `.js`（行 38）静态返回；`vercel.json` 的 `/(.*) → /public/$1`（行 22）已覆盖 `/geo/*.json` 与 `/globe.js`，无需改配置。

## 12. 验证计划

1. 本地：`node server.mjs`（默认 8787，可 `PORT=8878`），开 `http://127.0.0.1:8787/?tab=map`。
2. 接口：确认 `/api/prop-event?slug=world-cup-winner` 返回含 `image` 字段。
3. 功能：地球出现真实大陆轮廓；参赛国按概率蓝色高亮；自转 + 可拖拽；离开地图页/隐藏标签即暂停。
4. 交互：点击高概率国家（如法国）→ 高亮 + 概率小卡 + 排行榜对应行高亮滚动。
5. 排行榜：真实国旗显示、进度条按榜首缩放、药丸饱和度随概率变化；取不到旗时回退不报错。
6. 移动端：用手机宽度（≤390px）截图检查——无横向溢出、字体不过大、地球不卡、文字不互相遮挡。
7. 与官网对照：整体观感不弱于官网，地球信息量更强。
8. 部署：`npx vercel --prod --yes`，必要时 `alias` 到 `zhff.fifachina.xyz`，复验三个 tab。

## 13. 已知限制 / 风险

- 半球裁剪是主要技术风险（§6.1）；有回退方案。
- 英格兰/苏格兰/威尔士在 Natural Earth admin-0 中并入"United Kingdom"，世界杯里它们独立参赛——高亮时映射到英国轮廓（近似），文档记录此限制。
- 110m 精度下小国（如佛得角、卡塔尔）轮廓很小，高亮以排行榜为主、地球为辅。
- 真实国旗依赖 Polymarket 市场图标字段；个别队缺图时回退 CSS 国旗。

## 14. 范围外（可单独排期）

- "对阵图"标签（官网有、本站为死按钮 `index.html:2309`）。
- 首页赛程写死、6/18 后变空的定时炸弹（`lib/polymarket.mjs:2` 与 `index.html:2505`）。
- 详情页 `market-tabs` 等移动端字号压缩。
- 搜索/死代码清理。
