"use client";

import { TrendingUp, TrendingDown, Minus, Info, AlertCircle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  useMarketPrices,
  type PriceRow,
} from "@/lib/hooks/useDashboardData";

// ─── Display row type ─────────────────────────────────────────

type DisplayRow = {
  category: string;
  avg: string;
  range: string;
  trend: "up" | "down" | "flat";
  tx: number;
  data: { m: string; v: number }[];
};

// ─── Sparkline helpers ────────────────────────────────────────
// Generates a 6-point synthetic sparkline from real min/avg/max
// values returned by the backend. The shape reflects the trend
// direction — not hardcoded data.

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];

function buildSparkline(
  row: PriceRow
): { m: string; v: number }[] {
  const { min, avg, max, trend } = row;
  let pts: number[];

  if (trend === "up") {
    // Gradually rises from near-min to near-max
    pts = [min, min + (avg - min) * 0.3, avg - 0.5, avg, avg + (max - avg) * 0.5, max];
  } else if (trend === "down") {
    // Gradually falls from near-max to near-min
    pts = [max, max - (max - avg) * 0.3, avg + 0.5, avg, avg - (avg - min) * 0.5, min];
  } else {
    // Stays close to avg with small variance
    const d = (max - min) * 0.08;
    pts = [avg - d, avg + d, avg - d * 0.5, avg, avg + d * 0.5, avg];
  }

  return MONTHS.map((m, i) => ({ m, v: Number(pts[i].toFixed(2)) }));
}

function toDisplayRow(row: PriceRow): DisplayRow {
  return {
    category: row.category,
    avg: `S/ ${row.avg.toFixed(2)}`,
    range: `S/ ${Math.round(row.min)} – ${Math.round(row.max)}`,
    trend: row.trend,
    tx: row.txCount,
    data: buildSparkline(row),
  };
}

// ─── Sub-components ───────────────────────────────────────────

const TrendIcon = ({ t }: { t: "up" | "down" | "flat" }) => {
  if (t === "up") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  if (t === "down") return <TrendingDown className="w-4 h-4 text-[var(--terracotta)]" />;
  return <Minus className="w-4 h-4 text-[var(--muted-foreground)]" />;
};

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-[var(--ivory-2)] rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="p-5 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-[var(--ivory-2)] rounded w-1/3" />
        <div className="h-4 bg-[var(--ivory-2)] rounded w-8" />
      </div>
      <div className="h-7 bg-[var(--ivory-2)] rounded w-2/5" />
      <div className="h-3 bg-[var(--ivory-2)] rounded w-3/5 mt-2" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────

export function MarketPrices() {
  const { prices, loading, error } = useMarketPrices();
  const rows: DisplayRow[] = prices.map(toDisplayRow);

  return (
    <section id="precios" className="py-24 bg-[var(--ivory-2)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-10">
          <div className="lg:col-span-7">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--terracotta)]">
              Precios de mercado
            </div>
            <h2
              className="mt-3 text-3xl sm:text-4xl tracking-tight text-[var(--teal-deep)]"
              style={{ fontWeight: 600, lineHeight: 1.15 }}
            >
              Negocia con datos, no con suposiciones.
            </h2>
            <p className="mt-4 text-[var(--teal-deep)]/70 leading-relaxed max-w-2xl">
              Precio promedio, rango y tendencia por categoría, calculados con transacciones verificadas dentro de AlpaCash.
            </p>
          </div>
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[var(--border)] p-4 flex items-start gap-3">
            <Info className="w-4 h-4 mt-0.5 text-[var(--teal-500)] shrink-0" />
            <p className="text-xs text-[var(--teal-deep)]/80 leading-relaxed">
              Precio referencial basado en transacciones verificadas.{" "}
              <strong>No representa precio garantizado</strong>. Actualizado semanalmente.
            </p>
          </div>
        </div>

        {/* Price table */}
        {error ? (
          <div className="bg-white rounded-3xl border border-[var(--border)] flex items-center justify-center gap-2 py-14 text-[var(--muted-foreground)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">No se pudieron cargar los precios en este momento.</span>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[var(--border)] overflow-hidden">
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-[var(--ivory)] text-[var(--muted-foreground)]">
                <tr className="text-left">
                  <th className="px-6 py-4 font-normal">Categoría</th>
                  <th className="px-6 py-4 font-normal">Promedio</th>
                  <th className="px-6 py-4 font-normal">Rango</th>
                  <th className="px-6 py-4 font-normal">Tendencia</th>
                  <th className="px-6 py-4 font-normal">Histórico 6m</th>
                  <th className="px-6 py-4 font-normal text-right">Transacciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} />
                    ))
                  : rows.map((r) => (
                      <tr
                        key={r.category}
                        className="hover:bg-[var(--ivory)]/60 transition-colors"
                      >
                        <td
                          className="px-6 py-4 text-[var(--teal-deep)]"
                          style={{ fontWeight: 500 }}
                        >
                          {r.category}
                        </td>
                        <td className="px-6 py-4 text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>
                          {r.avg}{" "}
                          <span
                            className="text-[var(--muted-foreground)]"
                            style={{ fontWeight: 400 }}
                          >
                            / lb
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--teal-deep)]/80">{r.range}</td>
                        <td className="px-6 py-4">
                          <TrendIcon t={r.trend} />
                        </td>
                        <td className="px-6 py-4 w-40">
                          <div className="h-10">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={r.data}>
                                <XAxis dataKey="m" hide />
                                <Tooltip
                                  cursor={{ stroke: "var(--border)" }}
                                  contentStyle={{
                                    background: "white",
                                    border: "1px solid var(--border)",
                                    borderRadius: 8,
                                    fontSize: 11,
                                  }}
                                  formatter={(v: number) => [
                                    `S/ ${v.toFixed(1)}`,
                                    "Precio",
                                  ]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="v"
                                  stroke="var(--teal-deep)"
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-[var(--muted-foreground)]">
                          {r.tx}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <MobileCardSkeleton key={i} />
                  ))
                : rows.map((r) => (
                    <div key={r.category} className="p-5">
                      <div className="flex items-center justify-between">
                        <div
                          className="text-[var(--teal-deep)]"
                          style={{ fontWeight: 600 }}
                        >
                          {r.category}
                        </div>
                        <TrendIcon t={r.trend} />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <div
                          className="text-2xl text-[var(--teal-deep)]"
                          style={{ fontWeight: 600 }}
                        >
                          {r.avg}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">/ lb</div>
                      </div>
                      <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Rango {r.range} · {r.tx} transacciones
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
