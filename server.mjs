import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getChart, getFixtures, getHealth, getMarketsForSlug, getWorldCupPropEvent, getWorldCupProps, normalizePropSlug, normalizeSlug } from "./lib/polymarket.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const PORT = Number(process.env.PORT || 8787);

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  res.end(payload);
}

async function sendStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const rawPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const decoded = decodeURIComponent(rawPath);
  const filePath = path.normalize(path.join(publicDir, decoded));
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
    }[ext] || "application/octet-stream";
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": ext === ".html" ? "no-store" : "public, max-age=300",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/markets") {
      const slug = normalizeSlug(url.searchParams.get("slug"));
      const data = await getMarketsForSlug(slug, { force: url.searchParams.get("force") === "1" });
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname === "/api/chart") {
      const slug = normalizeSlug(url.searchParams.get("slug"));
      const data = await getChart(url.searchParams.get("interval") || "all", slug);
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname === "/api/props") {
      const data = await getWorldCupProps(url.searchParams.get("category") || "all", {
        force: url.searchParams.get("force") === "1",
      });
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname === "/api/prop-event") {
      const slug = normalizePropSlug(url.searchParams.get("slug"));
      const data = await getWorldCupPropEvent(slug, {
        force: url.searchParams.get("force") === "1",
      });
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname === "/api/fixtures") {
      const data = await getFixtures({ force: url.searchParams.get("force") === "1" });
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname === "/api/health") {
      sendJson(res, 200, getHealth());
      return;
    }

    await sendStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: String(error.message || error) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Polymarket dashboard listening on http://0.0.0.0:${PORT}`);
});
