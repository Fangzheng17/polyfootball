import { getChart, normalizeSlug } from "../lib/polymarket.mjs";

export default async function handler(req, res) {
  try {
    const slug = normalizeSlug(req.query?.slug);
    const data = await getChart(req.query?.interval || "all", slug);
    res.setHeader("cache-control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (error) {
    res.status(502).json({ error: String(error.message || error) });
  }
}
