import { getFixtures } from "../lib/polymarket.mjs";

export default async function handler(req, res) {
  try {
    const data = await getFixtures({ force: req.query?.force === "1" });
    res.setHeader("cache-control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(data);
  } catch (error) {
    res.status(502).json({ error: String(error.message || error) });
  }
}
