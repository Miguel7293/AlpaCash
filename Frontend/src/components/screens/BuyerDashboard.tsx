import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { ShoppingCart, Filter, ArrowUpRight, Truck } from "lucide-react";
import { DashShell, ArtCard, SectionLabel, SideNav } from "./DashShell";
import { LotTag, ChartSparkle, ReceiptPaper, ShieldWeave, FactorySimple, Compass, FiberBall, ScaleBalance, StampSeal } from "../icons/AlpaIcons";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { MarketplaceTab } from "./tabs/buyer/MarketplaceTab";
import { ComprasTab } from "./tabs/buyer/ComprasTab";
import { LogisticaTab } from "./tabs/buyer/LogisticaTab";
import { CalidadTab } from "./tabs/buyer/CalidadTab";
import { ProveedoresTab } from "./tabs/buyer/ProveedoresTab";
import { FinanciamientoTab } from "./tabs/buyer/FinanciamientoTab";
import type { DisplayLot } from "../modals/LotDetailModal";
import { useCart } from "@/lib/hooks/useCart";

const supply = [
  { m: "Ene", v: 320 }, { m: "Feb", v: 410 }, { m: "Mar", v: 540 },
  { m: "Abr", v: 720 }, { m: "May", v: 860 }, { m: "Jun", v: 940 },
];
const pricing = Array.from({ length: 20 }).map((_, i) => ({ d: i, v: +(32 + Math.cos(i / 3) * 1.5 + i * 0.1).toFixed(2) }));

const lots = [
  { id: "AC-2048", cat: "Baby", origin: "Puno", lb: 120, price: 32.5, prod: "Asoc. Tinta", grade: "A" },
  { id: "AC-2050", cat: "Súper Baby", origin: "Cusco", lb: 90, price: 41.2, prod: "Cabaña Sur", grade: "A+" },
  { id: "AC-2052", cat: "Fleece", origin: "Arequipa", lb: 260, price: 24.8, prod: "Coop. Maranganí", grade: "B" },
  { id: "AC-2054", cat: "Baby", origin: "Puno", lb: 140, price: 32.0, prod: "Asoc. Llalli", grade: "A" },
];

export function BuyerDashboard({ onBack, onOpenLot, onOpenCart }: { onBack: () => void; onOpenLot: (lot?: DisplayLot) => void; onOpenCart: () => void }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [tab, setTab] = useState("inicio");
  const { count } = useCart();
  const [stats, setStats] = useState({
    totalPurchased: 0,
    purchaseCount: 0,
    pendingVouchers: 0,
    avgScore: 0,
    ratingsCount: 0,
  });

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function loadStats() {
      try {
        const { data: empresaData } = await supabase
          .from("empresas")
          .select("id")
          .eq("profile_id", userId)
          .single();

        if (!empresaData) return;
        const empresaId = empresaData.id;

        const { data: txsData, error: txsError } = await supabase
          .from("transacciones")
          .select("estado, precio_por_libra, lotes_fibra(peso_libras)")
          .eq("empresa_id", empresaId);

        if (txsError) throw txsError;

        let totalPurchased = 0;
        let purchaseCount = 0;
        let pendingVouchers = 0;

        interface TransactionItem {
          estado: string;
          precio_por_libra: number | null;
          lotes_fibra: { peso_libras: number | null } | { peso_libras: number | null }[] | null;
        }

        if (txsData) {
          (txsData as unknown as TransactionItem[]).forEach((tx) => {
            const lotRaw = tx.lotes_fibra;
            const lot = Array.isArray(lotRaw) ? lotRaw[0] : lotRaw;
            const lbs = lot ? Number(lot.peso_libras || 0) : 0;
            const price = Number(tx.precio_por_libra || 0);
            const amount = lbs * price;

            if (tx.estado === "completada") {
              totalPurchased += amount;
              purchaseCount++;
            } else if (tx.estado === "en_proceso") {
              pendingVouchers++;
            }
          });
        }

        const { data: ratingsData, error: ratingsError } = await supabase
          .from("calificaciones")
          .select("puntaje")
          .eq("calificador_id", userId);

        if (ratingsError) throw ratingsError;

        let avgScore = 0;
        let ratingsCount = 0;
        if (ratingsData && ratingsData.length > 0) {
          const totalScore = (ratingsData as { puntaje: number }[]).reduce((sum, r) => sum + r.puntaje, 0);
          avgScore = totalScore / ratingsData.length;
          ratingsCount = ratingsData.length;
        }

        setStats({
          totalPurchased,
          purchaseCount,
          pendingVouchers,
          avgScore,
          ratingsCount,
        });
      } catch (err) {
        console.error("Error loading buyer stats:", err);
      }
    }

    loadStats();
  }, [user, supabase]);

  const nav = [
    { key: "inicio", label: "Panel", icon: <ChartSparkle size={18} /> },
    { key: "marketplace", label: "Marketplace", icon: <LotTag size={18} /> },
    { key: "compras", label: "Compras", icon: <ReceiptPaper size={18} /> },
    { key: "logistica", label: "Logística", icon: <Truck className="w-[18px] h-[18px]" /> },
    { key: "calidad", label: "Calidad", icon: <ShieldWeave size={18} /> },
    { key: "proveedores", label: "Proveedores", icon: <FactorySimple size={18} /> },
    { key: "financiamiento", label: "Financiamiento", icon: <ScaleBalance size={18} /> },
  ];

  const renderDashboardOverview = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: "Lotes en carrito", v: String(count), s: "Compra activa", bg: "var(--gold)" },
          { l: "Total comprado", v: `S/ ${stats.totalPurchased.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, s: `${stats.purchaseCount} lotes`, bg: "var(--mint)" },
          { l: "Vales pendientes", v: String(stats.pendingVouchers), s: "En verificación", bg: "var(--pink)" },
          { l: "Score promedio dado", v: stats.ratingsCount > 0 ? `${stats.avgScore.toFixed(1)}★` : "—", s: stats.ratingsCount > 0 ? `${stats.ratingsCount} calificaciones enviadas` : "Sin calificaciones aún", bg: "var(--gold-soft)" },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ArtCard className="p-5">
              <div className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center mb-3" style={{ background: k.bg }}>
                <FiberBall size={20} />
              </div>
              <div className="font-display text-3xl" style={{ fontWeight: 600 }}>{k.v}</div>
              <div className="text-xs text-[var(--ink)]/60">{k.l}</div>
              <div className="mt-1 font-mono text-[10px] uppercase text-[var(--ink)]/50">{k.s}</div>
            </ArtCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <ArtCard className="p-5">
          <SectionLabel n="N°01">Oferta de fibra disponible · libras</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={supply}>
                <XAxis dataKey="m" stroke="#0d1f1e80" />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#0d1f1e", border: "none", color: "#fff", borderRadius: 12 }} />
                <Bar dataKey="v" fill="#2a7a7c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ArtCard>

        <ArtCard className="p-5">
          <SectionLabel n="N°02">Tendencia precio Baby Alpaca</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={pricing}>
                <XAxis dataKey="d" hide />
                <YAxis hide domain={["dataMin-1", "dataMax+1"]} />
                <Tooltip contentStyle={{ background: "#0d1f1e", border: "none", color: "#fff", borderRadius: 12 }} />
                <Line dataKey="v" stroke="#c4593a" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ArtCard>
      </div>

      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <SectionLabel n="N°03">Lotes disponibles · curados</SectionLabel>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("marketplace")} className="px-4 py-2 rounded-full border-2 border-[var(--ink)] flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button
            onClick={onOpenCart}
            className="px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center gap-2 text-sm"
            style={{ fontWeight: 500 }}
          >
            <ShoppingCart className="w-4 h-4" /> Carrito · {count}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {lots.map((l, i) => (
          <motion.button
            key={l.id}
            onClick={() => onOpenLot({ id: l.id, cat: l.cat, origin: l.origin, lb: l.lb, price: l.price, prod: l.prod, grade: l.grade })}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="text-left"
          >
            <ArtCard className="p-4 h-full hover:-translate-y-1 transition-transform">
              <div className="flex items-start justify-between">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink)]/50">Pasaporte</div>
                <span className="px-2 py-0.5 rounded-full bg-[var(--gold)] text-[var(--ink)] text-[10px] font-mono" style={{ fontWeight: 700 }}>{l.grade}</span>
              </div>
              <div className="font-display text-2xl mt-1" style={{ fontWeight: 700 }}>{l.id}</div>
              <div className="mt-3 aspect-square rounded-xl border-2 border-[var(--ink)]/15 bg-[var(--ivory)] flex items-center justify-center">
                <FiberBall size={64} className="text-[var(--terracotta)] floaty" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-[var(--ink)]/60">{l.cat}</span>
                <span className="text-right font-mono">{l.lb} lb</span>
                <span className="text-[var(--ink)]/60">{l.origin}</span>
                <span className="text-right text-[var(--terracotta)]" style={{ fontWeight: 600 }}>S/ {l.price}/lb</span>
              </div>
              <div className="mt-3 pt-3 border-t-2 border-dashed border-[var(--ink)]/15 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[var(--ink)]/60">{l.prod}</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </ArtCard>
          </motion.button>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-3 gap-4">
        <ArtCard className="p-5 bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]">
          <Compass size={28} className="text-[var(--gold)]" />
          <div className="font-display text-xl mt-3" style={{ fontWeight: 600 }}>Mapa de oferta</div>
          <div className="text-sm text-[var(--ivory)]/70 mt-1">Puno · Cusco · Arequipa · Apurímac</div>
        </ArtCard>
        <ArtCard className="p-5 bg-[var(--gold)]/40">
          <ScaleBalance size={28} />
          <div className="font-display text-xl mt-3" style={{ fontWeight: 600 }}>Comparador</div>
          <div className="text-sm text-[var(--ink)]/70 mt-1">Compara hasta 3 lotes lado a lado.</div>
        </ArtCard>
        <ArtCard className="p-5 bg-[var(--mint)]/40">
          <StampSeal size={28} />
          <div className="font-display text-xl mt-3" style={{ fontWeight: 600 }}>Certificación</div>
          <div className="text-sm text-[var(--ink)]/70 mt-1">Sellos de aliados externos por lote.</div>
        </ArtCard>
      </div>
    </>
  );

  return (
    <DashShell
      role="Comprador"
      title="Mercado abierto, decisiones rápidas."
      subtitle="Lotes verificados, trazabilidad por nivel, y oferta agregada del altiplano en una sola vista."
      accent="var(--teal-500)"
      onBack={onBack}
      sidebar={<SideNav items={nav} active={tab} onPick={setTab} />}
    >
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
      {tab === "inicio" && renderDashboardOverview()}
      {tab === "marketplace" && <MarketplaceTab onOpenLot={onOpenLot} />}
      {tab === "compras" && <ComprasTab />}
      {tab === "logistica" && <LogisticaTab />}
      {tab === "calidad" && <CalidadTab />}
      {tab === "proveedores" && <ProveedoresTab />}
      {tab === "financiamiento" && <FinanciamientoTab />}
    </DashShell>
  );
}
