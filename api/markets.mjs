import { getMarketsForSlug, normalizeSlug } from "../lib/polymarket.mjs";

export default async function handler(req, res) {
  try {
    const slug = normalizeSlug(req.query?.slug);
    const data = await getMarketsForSlug(slug, { force: req.query?.force === "1" });
    res.setHeader("cache-control", "s-maxage=5, stale-while-revalidate=10");
    res.status(200).json(data);
  } catch (error) {
    res.status(502).json({ error: String(error.message || error) });
  }
}
