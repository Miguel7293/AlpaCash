import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Plus, ArrowUpRight, Camera, Calendar } from "lucide-react";
import { DashShell, ArtCard, SectionLabel, SideNav } from "./DashShell";
import { AlpacaHead, ScissorsShear, ReceiptPaper, ScaleBalance, ChartSparkle, StampSeal, MountainPath, LotTag, HandHold, FiberBall } from "../icons/AlpaIcons";
import { LotesTab } from "./tabs/producer/LotesTab";
import { OfertasTab } from "./tabs/producer/OfertasTab";
import { EsquilaTab } from "./tabs/producer/EsquilaTab";
import { PagosTab } from "./tabs/producer/PagosTab";
import { CapacitacionTab } from "./tabs/producer/CapacitacionTab";
import { FinanciamientoTab } from "./tabs/producer/FinanciamientoTab";
import type { DisplayLot } from "../modals/LotDetailModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";

const trend = Array.from({ length: 14 }).map((_, i) => ({ d: `D${i + 1}`, v: +(28 + Math.sin(i / 2) * 2 + i * 0.3).toFixed(2) }));

const myLots = [
  { id: "AC-2048", cat: "Baby", color: "Blanco", origin: "Puno", lb: 120, price: 32.5, st: "Listado" },
  { id: "AC-2049", cat: "Fleece", color: "LF", origin: "Cusco", lb: 240, price: 24.1, st: "En oferta" },
  { id: "AC-2051", cat: "Súper Baby", color: "Beige", origin: "Arequipa", lb: 80, price: 41.0, st: "Vendido" },
];

const offers = [
  { buyer: "Textiles Andina SAC", lot: "AC-2049", offer: "S/ 24.50", lb: "240", time: "hace 12 min" },
  { buyer: "Pacomarca Export", lot: "AC-2048", offer: "S/ 33.00", lb: "120", time: "hace 1 h" },
];

export function ProducerDashboard({ onBack, onOpenLot, onNewLot }: { onBack: () => void; onOpenLot: (lot?: DisplayLot) => void; onNewLot: () => void }) {
  const { user, nombre } = useAuth();
  const supabase = createClient();
  const [tab, setTab] = useState("inicio");
  const [stats, setStats] = useState({
    revenue: 0,
    activeLots: 0,
    reservadoLots: 0,
    rating: 0,
    ratingCount: 0,
  });

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function loadStats() {
      try {
        const { data: prodData } = await supabase
          .from("productores")
          .select("id")
          .eq("profile_id", userId)
          .single();

        if (!prodData) return;
        const producerId = prodData.id;

        const { data: lotsData, error: lotsError } = await supabase
          .from("lotes_fibra")
          .select("id, estado")
          .eq("productor_id", producerId);

        if (lotsError) throw lotsError;

        let activeLots = 0;
        let reservadoLots = 0;
        const lotIds: string[] = [];

        interface LotItem {
          id: string;
          estado: string;
        }

        if (lotsData) {
          (lotsData as unknown as LotItem[]).forEach((l) => {
            lotIds.push(l.id);
            if (l.estado === "disponible" || l.estado === "reservado") {
              activeLots++;
              if (l.estado === "reservado") {
                reservadoLots++;
              }
            }
          });
        }

        // Revenue from completed transactions — more accurate than listing price on lots.
        let revenue = 0;
        if (lotIds.length > 0) {
          interface SaleItem {
            precio_por_libra: number | null;
            lotes_fibra: { peso_libras: number | null } | { peso_libras: number | null }[] | null;
          }

          const { data: salesData, error: salesError } = await supabase
            .from("transacciones")
            .select("precio_por_libra, lotes_fibra(peso_libras)")
            .in("lote_id", lotIds)
            .eq("estado", "completada");

          if (salesError) throw salesError;

          if (salesData) {
            (salesData as unknown as SaleItem[]).forEach((tx) => {
              const lotRaw = tx.lotes_fibra;
              const lot = Array.isArray(lotRaw) ? lotRaw[0] : lotRaw;
              const lbs = lot ? Number(lot.peso_libras || 0) : 0;
              revenue += lbs * Number(tx.precio_por_libra || 0);
            });
          }
        }

        let avgRating = 0;
        let ratingCount = 0;
        if (lotIds.length > 0) {
          const { data: ratingsData, error: ratingsError } = await supabase
            .from("calificaciones")
            .select("puntaje")
            .in("lote_id", lotIds);

          if (ratingsError) throw ratingsError;

          if (ratingsData && ratingsData.length > 0) {
            const totalScore = (ratingsData as { puntaje: number }[]).reduce((sum, r) => sum + r.puntaje, 0);
            avgRating = totalScore / ratingsData.length;
            ratingCount = ratingsData.length;
          }
        }

        setStats({
          revenue,
          activeLots,
          reservadoLots,
          rating: avgRating,
          ratingCount,
        });
      } catch (err) {
        console.error("Error loading producer stats:", err);
      }
    }

    loadStats();
  }, [user, supabase]);

  const nav = [
    { key: "inicio", label: "Inicio", icon: <AlpacaHead size={18} /> },
    { key: "lotes", label: "Mis lotes", icon: <LotTag size={18} /> },
    { key: "ofertas", label: "Ofertas", icon: <HandHold size={18} /> },
    { key: "esquila", label: "Calendario esquila", icon: <ScissorsShear size={18} /> },
    { key: "pagos", label: "Pagos", icon: <ReceiptPaper size={18} /> },
    { key: "capacitacion", label: "Capacitación", icon: <ChartSparkle size={18} /> },
    { key: "financiamiento", label: "Financiamiento", icon: <ScaleBalance size={18} /> },
  ];

  return (
    <DashShell
      role="Productor"
      title={`Buen día, ${nombre || "Productor"}.`}
      subtitle="Tu fibra está pesada, etiquetada y lista. El mercado te está mirando."
      accent="var(--terracotta)"
      onBack={onBack}
      sidebar={<SideNav items={nav} active={tab} onPick={setTab} />}
    >
      {/* Mobile nav scroll */}
      <div className="lg:hidden -mx-5 sm:-mx-8 px-5 sm:px-8 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {nav.map((it) => (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm ${
                tab === it.key ? "bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]" : "bg-[var(--paper)] border-[var(--ink)]/10"
              }`}
            >
              {it.icon}<span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab !== "inicio" ? (
        <>
          {tab === "lotes" && <LotesTab onNewLot={onNewLot} onOpenLot={onOpenLot} />}
          {tab === "ofertas" && <OfertasTab />}
          {tab === "esquila" && <EsquilaTab />}
          {tab === "pagos" && <PagosTab />}
          {tab === "capacitacion" && <CapacitacionTab />}
          {tab === "financiamiento" && <FinanciamientoTab />}
        </>
      ) : (
        <>
      {/* KPIs row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Ingresos totales", v: `S/ ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: "Vendido", icon: <ChartSparkle size={20} />, bg: "var(--gold)" },
          { label: "Lotes activos", v: String(stats.activeLots), sub: `${stats.reservadoLots} en reserva`, icon: <LotTag size={20} />, bg: "var(--mint)" },
          { label: "Próxima esquila", v: "12 días", sub: "Cabaña Sur", icon: <ScissorsShear size={20} />, bg: "var(--pink)" },
          { label: "Calificación", v: stats.ratingCount > 0 ? `${stats.rating.toFixed(1)}★` : "—", sub: stats.ratingCount > 0 ? `${stats.ratingCount} valoraciones` : "Sin valoraciones aún", icon: <StampSeal size={20} />, bg: "var(--gold-soft)" },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ArtCard className="p-5 h-full">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center text-[var(--ink)]" style={{ background: k.bg }}>
                  {k.icon}
                </div>
                <span className="font-mono text-[10px] uppercase text-[var(--ink)]/50">{k.sub}</span>
              </div>
              <div className="mt-3 font-display text-3xl" style={{ fontWeight: 600 }}>{k.v}</div>
              <div className="text-xs text-[var(--ink)]/60 mt-0.5">{k.label}</div>
            </ArtCard>
          </motion.div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <ArtCard className="lg:col-span-2 p-5">
          <SectionLabel n="N°01">Tus ingresos · últimos 14 días</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="prodG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c4593a" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#c4593a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" hide />
                <Tooltip contentStyle={{ background: "#0d1f1e", border: "none", color: "#fff", borderRadius: 12 }} />
                <Area dataKey="v" stroke="#c4593a" strokeWidth={2.4} fill="url(#prodG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ArtCard>

        <div className="space-y-4">
          <button
            onClick={onNewLot}
            className="w-full text-left p-5 rounded-2xl bg-[var(--ink)] text-[var(--ivory)] border-2 border-[var(--ink)] brutalist-shadow-sm hover:bg-[var(--terracotta)] transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--gold)]">Acción rápida</div>
                <div className="font-display text-2xl mt-1" style={{ fontWeight: 600 }}>Registrar lote</div>
                <div className="text-xs text-[var(--ivory)]/70 mt-1">Pesa, fotografía y publica en 4 pasos.</div>
              </div>
              <span className="w-12 h-12 rounded-full bg-[var(--gold)] text-[var(--ink)] flex items-center justify-center group-hover:rotate-45 transition-transform">
                <Plus className="w-6 h-6" />
              </span>
            </div>
          </button>

          <ArtCard className="p-4">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-[var(--terracotta)]" />
              <div className="text-sm">Toma foto con tu celular y la IA pre-clasifica.</div>
            </div>
          </ArtCard>

          <ArtCard className="p-4 bg-[var(--gold)]/30">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--ink)]" />
              <div className="text-sm"><span style={{ fontWeight: 600 }}>Esquila comunitaria</span> · 5 de junio</div>
            </div>
          </ArtCard>
        </div>
      </div>

      {/* Lots + offers */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionLabel n="N°02">Mis lotes</SectionLabel>
          <div className="space-y-3">
            {myLots.map((l, i) => (
              <motion.button
                key={l.id}
                onClick={() => onOpenLot?.({ id: l.id, cat: l.cat, color: l.color, origin: l.origin, lb: l.lb, price: l.price, prod: "Productor verificado" })}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="w-full text-left"
              >
                <ArtCard className="p-4 flex items-center gap-4 hover:translate-x-1 transition-transform">
                  <div className="w-12 h-12 rounded-xl bg-[var(--ivory)] border-2 border-[var(--ink)] flex items-center justify-center">
                    <FiberBall size={22} className="text-[var(--terracotta)]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink)]/50">{l.cat} · {l.color}</div>
                    <div className="font-display text-xl leading-none mt-0.5" style={{ fontWeight: 600 }}>{l.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{l.lb} lb</div>
                    <div className="text-xs text-[var(--ink)]/60">S/ {l.price}/lb</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border-2 ${
                    l.st === "Vendido" ? "bg-[var(--mint)] border-[var(--ink)]" : l.st === "En oferta" ? "bg-[var(--gold)] border-[var(--ink)]" : "bg-[var(--paper)] border-[var(--ink)]/30"
                  }`}>{l.st}</span>
                </ArtCard>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel n="N°03">Ofertas recibidas</SectionLabel>
          <div className="space-y-3">
            {offers.map((o, i) => (
              <ArtCard key={i} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-lg" style={{ fontWeight: 600 }}>{o.buyer}</div>
                    <div className="text-xs text-[var(--ink)]/60 mt-0.5">Por lote <span className="font-mono">{o.lot}</span> · {o.lb} lb · {o.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl text-[var(--terracotta)]" style={{ fontWeight: 700 }}>{o.offer}</div>
                    <div className="text-[10px] font-mono uppercase text-[var(--ink)]/40">por libra</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setTab("ofertas")} className="flex-1 px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--ivory)] text-sm flex items-center justify-center gap-2" style={{ fontWeight: 500 }}>
                    Aceptar <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <button onClick={() => setTab("ofertas")} className="flex-1 px-4 py-2 rounded-full border-2 border-[var(--ink)] text-sm" style={{ fontWeight: 500 }}>Contraoferta</button>
                </div>
              </ArtCard>
            ))}
            <ArtCard className="p-4 bg-[var(--pink)]/40">
              <div className="flex items-center gap-3">
                <ScaleBalance size={22} className="text-[var(--terracotta-deep)]" />
                <div className="text-sm">
                  <span style={{ fontWeight: 600 }}>Acompañamiento.</span> Si dudas, pide consejo a un facilitador.
                </div>
              </div>
            </ArtCard>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--ink)]/40">
        <span><MountainPath size={14} className="inline mr-1" /> Tinta, Cusco · 4127 msnm</span>
        <span>v1.0 · privado por nivel</span>
      </div>
        </>
      )}
    </DashShell>
  );
}
