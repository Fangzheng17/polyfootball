import { getWorldCupProps } from "../lib/polymarket.mjs";

export default async function handler(req, res) {
  try {
    const category = req.query?.category || "all";
    const data = await getWorldCupProps(category, { force: req.query?.force === "1" });
    res.setHeader("cache-control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (error) {
    res.status(502).json({ error: String(error.message || error) });
  }
}
