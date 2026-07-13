import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Activity, Circle } from "lucide-react";
import { useLanguage } from "@/lib/providers/LanguageProvider";

type Point = { t: number; v: number };

function seed(n: number, base: number) {
  const arr: Point[] = [];
  let v = base;
  const baseTime = 1779667200000 - n * 2000;
  for (let i = 0; i < n; i++) {
    // Deterministic sine wave offset to avoid Math.random during initial SSR/hydration
    v += Math.sin(i) * 0.15;
    arr.push({ t: baseTime + i * 2000, v: +v.toFixed(2) });
  }
  return arr;
}

const SECONDARY = [
  { code: "SBABY", label: "Súper Baby", base: 41.0 },
  { code: "FLEEC", label: "Fleece", base: 24.0 },
  { code: "MFLEC", label: "Medium Fleece", base: 18.5 },
  { code: "HUARI", label: "Huarizo", base: 14.0 },
];

export function LivePriceTicker() {
  const { t } = useLanguage();
  const [range, setRange] = useState("1D");
  const base = 32.5;
  const [data, setData] = useState<Point[]>(() => seed(40, base));
  const [tick, setTick] = useState(0);
  const lastRef = useRef(base);

  // Live update
  useEffect(() => {
    // Shift timestamps to match actual client's current time on mount (avoids hydration mismatch)
    const timer = setTimeout(() => {
      setData((prev) => {
        const now = Date.now();
        return prev.map((p, idx) => ({
          ...p,
          t: now - (prev.length - 1 - idx) * 1800,
        }));
      });
    }, 0);

    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1].v;
        const drift = (Math.random() - 0.48) * 0.45;
        const next = Math.max(28, Math.min(36, last + drift));
        lastRef.current = next;
        const point: Point = { t: Date.now(), v: +next.toFixed(2) };
        return [...prev.slice(1), point];
      });
      setTick((t) => t + 1);
    }, 1800);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, []);

  const stats = useMemo(() => {
    const first = data[0].v;
    const last = data[data.length - 1].v;
    const change = last - first;
    const pct = (change / first) * 100;
    const high = Math.max(...data.map((d) => d.v));
    const low = Math.min(...data.map((d) => d.v));
    return { last, change, pct, high, low, up: change >= 0 };
  }, [data]);

  // small live ticks for sidebar items
  const [side, setSide] = useState(() =>
    SECONDARY.map((s) => ({ ...s, price: s.base, delta: 0 }))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setSide((prev) =>
        prev.map((s) => {
          const drift = (Math.random() - 0.5) * 0.3;
          const np = +(s.price + drift).toFixed(2);
          return { ...s, price: np, delta: +(np - s.base).toFixed(2) };
        })
      );
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="bg-[var(--teal-deep)] text-[var(--ivory)] border-b border-white/10 relative overflow-hidden">
      {/* scrolling marquee ticker */}
      <div className="border-b border-white/10 bg-[var(--teal-700)]/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-2 flex items-center gap-4 text-xs overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex items-center">
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[var(--gold-soft)] tracking-wide" style={{ fontWeight: 500 }}>{t.ticker.live}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-6 whitespace-nowrap animate-[ticker_30s_linear_infinite]">
              {[...side, ...side].map((s, i) => (
                <span key={i} className="text-[var(--ivory)]/80">
                  <span className="text-[var(--gold-soft)]">{s.code}</span>{" "}
                  <span className="text-[var(--ivory)]">S/ {s.price.toFixed(2)}</span>{" "}
                  <span className={s.delta >= 0 ? "text-emerald-300" : "text-[var(--terracotta-soft)]"}>
                    {s.delta >= 0 ? "▲" : "▼"} {Math.abs(s.delta).toFixed(2)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main chart row */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 grid lg:grid-cols-12 gap-6 items-center">
        {/* left: identity + price */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--gold-soft)]">
            <Activity className="w-3 h-3" /> {t.ticker.asset}
          </div>
          <div className="mt-1.5 flex items-baseline gap-3">
            <div className="text-4xl tracking-tight" style={{ fontWeight: 600 }}>
              S/ {stats.last.toFixed(2)}
            </div>
            <div className="text-xs text-[var(--ivory)]/60">/ lb</div>
          </div>
          <div className={`mt-1 flex items-center gap-2 text-sm ${stats.up ? "text-emerald-300" : "text-[var(--terracotta-soft)]"}`}>
            {stats.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span style={{ fontWeight: 500 }}>
              {stats.up ? "+" : ""}{stats.change.toFixed(2)} ({stats.pct.toFixed(2)}%)
            </span>
            <span className="text-[var(--ivory)]/50">{t.ticker.today}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
            <Stat label={t.ticker.max} value={`S/ ${stats.high.toFixed(2)}`} />
            <Stat label={t.ticker.min} value={`S/ ${stats.low.toFixed(2)}`} />
            <Stat label={t.ticker.txToday} value={String(120 + (tick % 9))} />
          </div>
        </div>

        {/* chart */}
        <div className="lg:col-span-6 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stats.up ? "#34d399" : "#e09277"} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={stats.up ? "#34d399" : "#e09277"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
              <Tooltip
                contentStyle={{ background: "#0f3739", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11, color: "white" }}
                labelFormatter={(t) => new Date(t as number).toLocaleTimeString()}
                formatter={(v: number) => [`S/ ${v.toFixed(2)}`, t.ticker.price]}
                cursor={{ stroke: "rgba(255,255,255,0.2)" }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={stats.up ? "#34d399" : "#e09277"}
                strokeWidth={2}
                fill="url(#liveGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* timeframe toggles + status */}
        <div className="lg:col-span-2 flex lg:flex-col gap-2 lg:items-end">
          <div className="flex gap-1 bg-white/5 rounded-full p-1 text-[11px] border border-white/10">
            {["1H", "1D", "1S", "1M", "1A"].map((t) => (
              <button
                key={t}
                onClick={() => setRange(t)}
                className={`px-2.5 py-1 rounded-full transition-colors ${range === t ? "bg-[var(--gold)] text-[var(--teal-deep)]" : "text-[var(--ivory)]/70 hover:text-[var(--ivory)]"}`}
                style={{ fontWeight: range === t ? 600 : 400 }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-[var(--ivory)]/50 flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
            {t.ticker.updated}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
      <div className="text-[var(--ivory)]/50">{label}</div>
      <div className="text-[var(--ivory)]" style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}
