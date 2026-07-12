import { Request, Response } from "express";
import { getMarketPrices } from "./precios.service";

/**
 * GET /api/precios
 *
 * Returns an array of PriceRow objects — one per fiber category with
 * aggregated price stats (avg, min, max, trend, txCount) derived from
 * completed marketplace transactions.
 *
 * Public endpoint: no auth required.
 * Responds with [] when no transaction data is available.
 */
export async function getPrecios(_req: Request, res: Response): Promise<void> {
  try {
    const prices = await getMarketPrices();
    res.json(prices);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener precios";
    res.status(500).json({ message });
  }
}
