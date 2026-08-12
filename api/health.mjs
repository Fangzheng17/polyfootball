import { getHealth } from "../lib/polymarket.mjs";

export default function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  res.status(200).json(getHealth());
}
