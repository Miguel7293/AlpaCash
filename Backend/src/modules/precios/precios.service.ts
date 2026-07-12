import { supabaseAdmin } from "../../config/supabase";

// Public contract consumed by the frontend MarketPrices component
// and by GET /api/precios.
export type PriceRow = {
  /** categorias_fibra.nombre */
  category: string;
  /** Average precio_por_libra across completed transactions */
  avg: number;
  min: number;
  max: number;
  /** Comparison: last-90-day avg vs prior-90-day (91-180 days ago) */
  trend: "up" | "down" | "flat";
  /** Count of completada transactions for this category */
  txCount: number;
};

interface TxPoint {
  price: number;
  date: Date;
}

// Display order mirrors foundation.sql quality levels (finest first)
const CATEGORY_ORDER: Record<string, number> = {
  "Súper Baby": 1,
  "Baby Alpaca": 2,
  Fleece: 3,
  "Médium Fleece": 4,
  Huarizo: 5,
};

function computeTrend(txs: TxPoint[]): "up" | "down" | "flat" {
  const now = Date.now();
  const ms = (d: number) => d * 24 * 60 * 60 * 1000;
  const boundary90 = new Date(now - ms(90));
  const boundary180 = new Date(now - ms(180));

  const recent = txs
    .filter((t) => t.date >= boundary90)
    .map((t) => t.price);
  const prior = txs
    .filter((t) => t.date >= boundary180 && t.date < boundary90)
    .map((t) => t.price);

  // Not enough history to compute a meaningful direction
  if (recent.length === 0 || prior.length === 0) return "flat";

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const r = avg(recent);
  const p = avg(prior);

  // 1% tolerance band avoids spurious up/down on near-equal values
  if (r > p * 1.01) return "up";
  if (r < p * 0.99) return "down";
  return "flat";
}

/**
 * Aggregates completed transaction prices per fiber category.
 * Uses supabaseAdmin (service role) so RLS on transacciones is bypassed.
 *
 * Returns an empty array when no completada transactions exist —
 * callers must handle the empty state gracefully.
 */
export async function getMarketPrices(): Promise<PriceRow[]> {
  const { data, error } = await supabaseAdmin
    .from("transacciones")
    .select(
      `precio_por_libra,
       created_at,
       lotes_fibra ( categorias_fibra ( nombre ) )`
    )
    .eq("estado", "completada");

  if (error) {
    throw new Error(`Failed to fetch price data: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups: Record<string, TxPoint[]> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of data as any[]) {
    const category: string | undefined =
      row?.lotes_fibra?.categorias_fibra?.nombre;
    const price = Number(row?.precio_por_libra);
    if (!category || !isFinite(price)) continue;

    (groups[category] ??= []).push({
      price,
      date: new Date(row.created_at as string),
    });
  }

  return Object.entries(groups)
    .map(([category, txs]) => {
      const prices = txs.map((t) => t.price);
      const sum = prices.reduce((a, b) => a + b, 0);
      return {
        category,
        avg: Math.round((sum / prices.length) * 100) / 100,
        min: Math.min(...prices),
        max: Math.max(...prices),
        trend: computeTrend(txs),
        txCount: prices.length,
      };
    })
    .sort(
      (a, b) =>
        (CATEGORY_ORDER[a.category] ?? 99) -
        (CATEGORY_ORDER[b.category] ?? 99)
    );
}
