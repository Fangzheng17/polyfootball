/*
 * 世界杯冠军霜玻璃地球 — Canvas2D 正射投影矢量地球
 * 单一职责：把 teams[] 渲染成可交互的地球。
 * 用法：const g = createWorldGlobe(canvas, opts); g.update(teams); g.setActive(true);
 *   teams: [{ cnName, prob, flagImg, geoName }]  geoName 对齐 world-atlas properties.name
 *   opts: { geoUrl, labelLayer, onCountrySelect(team|null), onReady() }
 */
(function () {
  const DEG = Math.PI / 180;

  // 概率色阶（霜玻璃浅色 · 蓝色梯度，低→高）
  const RAMP = [
    [0.0, [220, 233, 248]],
    [0.25, [181, 212, 244]],
    [0.5, [106, 166, 224]],
    [0.75, [47, 111, 184]],
    [1.0, [22, 70, 126]],
  ];

  function rampColor(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < RAMP.length; i++) {
      if (t <= RAMP[i][0]) {
        const [t0, c0] = RAMP[i - 1];
        const [t1, c1] = RAMP[i];
        const f = (t - t0) / (t1 - t0 || 1);
        const r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
        const g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
        const b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
        return `rgb(${r},${g},${b})`;
      }
    }
    return `rgb(${RAMP[RAMP.length - 1][1].join(",")})`;
  }

  // ---- TopoJSON 解码（处理量化 transform + 弧线 delta）----
  function decodeTopology(topo, objectName) {
    const { scale, translate } = topo.transform || { scale: [1, 1], translate: [0, 0] };
    const [sx, sy] = scale;
    const [tx, ty] = translate;
    const rawArcs = topo.arcs;
    const arcCache = new Array(rawArcs.length);

    function decodeArc(index) {
      if (arcCache[index]) return arcCache[index];
      let x = 0, y = 0;
      const out = rawArcs[index].map((d) => {
        x += d[0];
        y += d[1];
        return [x * sx + tx, y * sy + ty];
      });
      arcCache[index] = out;
      return out;
    }

    function arcPoints(i) {
      if (i < 0) {
        const a = decodeArc(~i).slice().reverse();
        return a;
      }
      return decodeArc(i).slice();
    }

    function ring(arcIds) {
      const pts = [];
      arcIds.forEach((id, k) => {
        const seg = arcPoints(id);
        if (k > 0) seg.shift();
        pts.push(...seg);
      });
      // 去掉与首点重合的尾点，便于裁剪
      if (pts.length > 1) {
        const a = pts[0], b = pts[pts.length - 1];
        if (a[0] === b[0] && a[1] === b[1]) pts.pop();
      }
      return pts;
    }

    function polygons(geom) {
      if (geom.type === "Polygon") return [geom.arcs.map(ring)];
      if (geom.type === "MultiPolygon") return geom.arcs.map((poly) => poly.map(ring));
      return [];
    }

    return topo.objects[objectName].geometries
      .map((geom) => {
        const polys = polygons(geom);
        if (!polys.length) return null;
        // 质心（粗略，取最大外环）
        let outer = polys[0][0], best = 0;
        polys.forEach((p) => {
          if (p[0] && p[0].length > best) { best = p[0].length; outer = p[0]; }
        });
        let clon = 0, clat = 0;
        outer.forEach((p) => { clon += p[0]; clat += p[1]; });
        clon /= outer.length || 1;
        clat /= outer.length || 1;
        return { name: (geom.properties && geom.properties.name) || "", polys, clon, clat };
      })
      .filter(Boolean);
  }

  function createWorldGlobe(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const wrap = canvas.parentElement;
    const labelLayer = opts.labelLayer || null;
    const onSelect = opts.onCountrySelect || function () {};

    let countries = [];
    let geoColor = new Map();   // geoName -> css color
    let teamByGeo = new Map();  // geoName -> team
    let byName = new Map();     // geoName -> country
    let markerOrder = [];       // 旗+概率标记，按概率降序
    let rotation = -20;         // 经度偏移（自转）
    let tilt = -0.12;           // 绕 X 轴倾角
    let active = false;
    let dragging = false;
    let lastX = 0, lastY = 0, moved = 0;
    let rafId = null;
    let lastFrame = 0;
    let selected = null;        // geoName
    let cx = 0, cy = 0, R = 0;

    const isMobile = () => window.innerWidth <= 700;

    // ---- 投影 ----
    function rot(lon, lat) {
      const lambda = (lon + rotation) * DEG;
      const phi = lat * DEG;
      const x = Math.cos(phi) * Math.sin(lambda);
      const y = Math.sin(phi);
      const z = Math.cos(phi) * Math.cos(lambda);
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      return [x, y * ct - z * st, y * st + z * ct]; // [x, y', depth]
    }

    function cross(a, b) {
      const t = a[2] / (a[2] - b[2]);
      let x = a[0] + (b[0] - a[0]) * t;
      let y = a[1] + (b[1] - a[1]) * t;
      const m = Math.hypot(x, y) || 1;
      return [x / m, y / m, 0];
    }

    // 把经纬度环裁剪到可见半球并投影到屏幕
    function projectRing(r) {
      const n = r.length;
      if (!n) return null;
      const P = new Array(n);
      for (let i = 0; i < n; i++) P[i] = rot(r[i][0], r[i][1]);
      const out = [];
      for (let i = 0; i < n; i++) {
        const cur = P[i], prev = P[(i - 1 + n) % n];
        const ci = cur[2] >= 0, pi = prev[2] >= 0;
        if (ci) {
          if (!pi) out.push(cross(prev, cur));
          out.push(cur);
        } else if (pi) {
          out.push(cross(prev, cur));
        }
      }
      if (out.length < 3) return null;
      const screen = new Array(out.length);
      for (let i = 0; i < out.length; i++) screen[i] = [cx + R * out[i][0], cy - R * out[i][1]];
      return screen;
    }

    function pathCountry(country) {
      let drew = false;
      for (const poly of country.polys) {
        for (let ri = 0; ri < poly.length; ri++) {
          const scr = projectRing(poly[ri]);
          if (!scr) continue;
          ctx.moveTo(scr[0][0], scr[0][1]);
          for (let i = 1; i < scr.length; i++) ctx.lineTo(scr[i][0], scr[i][1]);
          ctx.closePath();
          drew = true;
        }
      }
      return drew;
    }

    // ---- 尺寸 ----
    function resize() {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(280, Math.round(rect.width));
      const h = Math.max(240, Math.round(rect.height));
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      cx = w / 2;
      cy = h / 2;
      R = Math.min(w, h) * 0.46;
    }

    // ---- 绘制 ----
    function draw() {
      const w = canvas.width / (Math.min(2, window.devicePixelRatio || 1));
      const h = canvas.height / (Math.min(2, window.devicePixelRatio || 1));
      ctx.clearRect(0, 0, w, h);

      // 外发光 halo
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(150,175,205,0.12)";
      ctx.fill();

      // 海洋球体（霜玻璃径向）
      const og = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.36, R * 0.1, cx, cy, R * 1.05);
      og.addColorStop(0, "#ffffff");
      og.addColorStop(0.6, "#eaf1f8");
      og.addColorStop(1, "#d7e3f0");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = og;
      ctx.fill();

      // 裁剪到球体内
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // 陆地 + 高亮（一遍）
      ctx.lineJoin = "round";
      for (const c of countries) {
        const depth = rot(c.clon, c.clat)[2];
        if (depth < -0.3) continue; // 背面剔除
        ctx.beginPath();
        const drew = pathCountry(c);
        if (!drew) continue;
        const hl = geoColor.get(c.name);
        ctx.fillStyle = hl || "#cfd8e4";
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = hl ? "rgba(255,255,255,0.55)" : "rgba(95,112,134,0.40)";
        ctx.stroke();
      }

      // 选中国家强调
      if (selected) {
        const c = countries.find((x) => x.name === selected);
        if (c && rot(c.clon, c.clat)[2] >= -0.3) {
          ctx.beginPath();
          if (pathCountry(c)) {
            ctx.fillStyle = "rgba(22,70,126,0.92)";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#0c447c";
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      // 球缘
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(150,170,196,0.7)";
      ctx.stroke();

      positionLabels();
    }

    // ---- 国家国旗+概率标记（常驻，随地球旋转）----
    function buildMarkers() {
      if (!labelLayer) return;
      labelLayer.innerHTML = "";
      markerOrder = [];
      const entries = [];
      teamByGeo.forEach((team, geo) => {
        const c = byName.get(geo);
        if (!c) return;
        entries.push({ geoName: geo, team, lon: c.clon, lat: c.clat, el: null });
      });
      entries.sort((a, b) => (b.team.prob || 0) - (a.team.prob || 0));
      for (const e of entries) {
        const el = document.createElement("div");
        el.className = "globe-mk";
        const flag = e.team.flagImg ? `<img src="${esc(e.team.flagImg)}" alt="" onerror="this.remove()">` : "";
        el.innerHTML = `${flag}<b>${formatPct(e.team.prob)}</b>`;
        el.style.display = "none";
        labelLayer.appendChild(el);
        e.el = el;
        markerOrder.push(e);
      }
    }

    function positionLabels() {
      if (!labelLayer || !markerOrder.length) return;
      const mobile = isMobile();
      const cap = mobile ? 12 : 26;
      const minx = mobile ? 38 : 46;
      const miny = mobile ? 20 : 22;
      const placed = [];
      let shown = 0;
      for (const m of markerOrder) {
        const p = rot(m.lon, m.lat);
        const isSel = m.geoName === selected;
        if (p[2] < 0.1 || (shown >= cap && !isSel)) { m.el.style.display = "none"; continue; }
        const x = cx + R * p[0];
        const y = cy - R * p[1];
        if (!isSel && placed.some((q) => Math.abs(q.x - x) < minx && Math.abs(q.y - y) < miny)) {
          m.el.style.display = "none";
          continue;
        }
        placed.push({ x, y });
        shown++;
        m.el.style.display = "";
        m.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        m.el.style.opacity = String(Math.min(1, 0.5 + (p[2] - 0.1) * 1.5));
        m.el.style.zIndex = String(isSel ? 60 : 20 + Math.round(p[2] * 20));
        m.el.classList.toggle("sel", isSel);
      }
    }

    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, (m) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }
    function formatPct(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return "";
      if (n > 0 && n < 0.01) return "<1%";
      return Math.round(n * 100) + "%";
    }

    // ---- 命中测试：屏幕点 -> 经纬度 -> 国家 ----
    function screenToLonLat(px, py) {
      const nx = (px - cx) / R;
      const ny = -(py - cy) / R;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) return null;
      const nz = Math.sqrt(1 - d2);
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      // 逆 tilt
      const x = nx;
      const y = ny * ct + nz * st;
      const z = -ny * st + nz * ct;
      let lon = Math.atan2(x, z) / DEG - rotation;
      lon = ((lon + 180) % 360 + 360) % 360 - 180;
      const lat = Math.asin(Math.max(-1, Math.min(1, y))) / DEG;
      return [lon, lat];
    }

    function pointInRing(lon, lat, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
      }
      return inside;
    }

    function countryAt(lon, lat) {
      for (const c of countries) {
        if (Math.abs(lat - c.clat) > 40) continue;
        for (const poly of c.polys) {
          if (poly[0] && pointInRing(lon, lat, poly[0])) return c;
        }
      }
      return null;
    }

    function setSelected(name, notify) {
      selected = name || null;
      if (notify) onSelect(selected ? (teamByGeo.get(selected) || { cnName: selected, geoName: selected }) : null);
      draw();
    }

    // ---- 交互 ----
    function onDown(e) {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.classList.add("dragging");
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      rotation += dx * 0.4;
      tilt = Math.max(-0.7, Math.min(0.7, tilt + dy * 0.006));
      lastX = e.clientX;
      lastY = e.clientY;
    }
    function onUp(e) {
      const wasDrag = moved > 6;
      dragging = false;
      canvas.classList.remove("dragging");
      canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId);
      if (!wasDrag) {
        const rect = canvas.getBoundingClientRect();
        const ll = screenToLonLat(e.clientX - rect.left, e.clientY - rect.top);
        const hit = ll ? countryAt(ll[0], ll[1]) : null;
        setSelected(hit ? hit.name : null, true);
      }
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    let roTimer = null;
    const onResize = () => { clearTimeout(roTimer); roTimer = setTimeout(() => { resize(); draw(); }, 120); };
    window.addEventListener("resize", onResize);

    // ---- 动画 ----
    function tick(now) {
      if (!active) { rafId = null; return; }
      rafId = requestAnimationFrame(tick);
      if (document.hidden) return;
      const minDelta = isMobile() ? 33 : 16;
      if (now - lastFrame < minDelta) return;
      lastFrame = now;
      if (!dragging) rotation += 0.12;
      draw();
    }

    // ---- 数据加载 ----
    let ready = false;
    fetch(opts.geoUrl || "/geo/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        countries = decodeTopology(topo, "countries");
        byName = new Map(countries.map((c) => [c.name, c]));
        ready = true;
        resize();
        draw();
        if (opts.onReady) opts.onReady();
        if (active && !rafId) rafId = requestAnimationFrame(tick);
      })
      .catch((err) => {
        if (opts.onError) opts.onError(err);
      });

    return {
      update(teams) {
        geoColor = new Map();
        teamByGeo = new Map();
        const list = (teams || []).filter((t) => t && t.geoName);
        let max = 0;
        list.forEach((t) => { if (Number(t.prob) > max) max = Number(t.prob); });
        max = max || 1;
        // 同一地理要素取最高概率（英格兰/苏格兰都→英国）
        const probByGeo = new Map();
        list.forEach((t) => {
          const prev = probByGeo.get(t.geoName);
          if (prev == null || t.prob > prev) {
            probByGeo.set(t.geoName, t.prob);
            teamByGeo.set(t.geoName, t);
          }
        });
        probByGeo.forEach((prob, geo) => {
          geoColor.set(geo, rampColor(Number(prob) / max));
        });
        buildMarkers();
        if (ready) draw();
      },
      selectCountry(geoName) { setSelected(geoName, false); },
      setActive(on) {
        active = !!on;
        if (active) {
          resize();
          if (ready) draw();
          if (!rafId) rafId = requestAnimationFrame(tick);
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      isReady() { return ready; },
      destroy() {
        active = false;
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
      },
    };
  }

  window.createWorldGlobe = createWorldGlobe;
})();
