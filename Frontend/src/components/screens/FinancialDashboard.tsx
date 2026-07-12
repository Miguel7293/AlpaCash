import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, TrendingUp, FileCheck } from "lucide-react";
import { DashShell, ArtCard, SectionLabel, SideNav } from "./DashShell";
import { Vault, ReceiptPaper, ChartSparkle, ScaleBalance, ShieldWeave, ClipboardCheckArt, HandHold } from "../icons/AlpaIcons";
import { ScoringTab } from "./tabs/financial/ScoringTab";
import { CreditosTab } from "./tabs/financial/CreditosTab";
import { VouchersTab } from "./tabs/financial/VouchersTab";
import { SegurosTab } from "./tabs/financial/SegurosTab";
import { AuditoriaTab } from "./tabs/financial/AuditoriaTab";
import { createClient } from "@/lib/supabase/client";

const cashflow = Array.from({ length: 12 }).map((_, i) => ({
  m: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i],
  v: +(80 + Math.sin(i / 2) * 20 + i * 4).toFixed(1),
}));

export function FinancialDashboard({ onBack }: { onBack: () => void }) {
  const supabase = createClient();
  const [tab, setTab] = useState("inicio");
  const [queueOpen, setQueueOpen] = useState(false);
  const [stats, setStats] = useState({
    activePortfolio: 0,
    activeCreditsCount: 0,
    totalVouchers: 0,
    pendingVouchers: 0,
    scoredProducersCount: 0,
    pendingEvaluationsCount: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: creditsData, error: creditsError } = await supabase
          .from("evaluaciones_crediticias")
          .select("estado, monto_solicitado, productor_id, score");

        if (creditsError) throw creditsError;

        let activePortfolio = 0;
        let activeCreditsCount = 0;
        let pendingEvaluationsCount = 0;
        const scoredProducersSet = new Set<string>();

        interface CreditItem {
          estado: string;
          monto_solicitado: number | null;
          productor_id: string | null;
          score: number | null;
        }

        if (creditsData) {
          (creditsData as unknown as CreditItem[]).forEach((c) => {
            if (c.estado === "aprobado" || c.estado === "desembolsado") {
              // Only count genuinely active (approved + disbursed) credits.
              // "completada" = closed/repaid — not part of the active portfolio.
              activePortfolio += Number(c.monto_solicitado || 0);
              activeCreditsCount++;
            } else if (c.estado === "en_evaluacion" || c.estado === "pendiente") {
              pendingEvaluationsCount++;
            }
            if (c.productor_id && c.score !== null) {
              scoredProducersSet.add(c.productor_id);
            }
          });
        }

        const { data: txsData, error: txsError } = await supabase
          .from("transacciones")
          .select("estado");

        if (txsError) throw txsError;

        let totalVouchers = 0;
        let pendingVouchers = 0;

        interface TransactionItem {
          estado: string;
        }

          if (txsData) {
            totalVouchers = txsData.length;
            (txsData as unknown as TransactionItem[]).forEach((tx) => {
              // Schema states: en_proceso | completada | cancelada — "pendiente" does not exist.
              if (tx.estado === "en_proceso") {
                pendingVouchers++;
              }
            });
          }

        setStats({
          activePortfolio,
          activeCreditsCount,
          totalVouchers,
          pendingVouchers,
          scoredProducersCount: scoredProducersSet.size,
          pendingEvaluationsCount,
        });
      } catch (err) {
        console.error("Error loading financial stats:", err);
      }
    }

    loadStats();
  }, [supabase]);

  const nav = [
    { key: "inicio", label: "Panel", icon: <ChartSparkle size={18} /> },
    { key: "scoring", label: "Scoring productor", icon: <ScaleBalance size={18} /> },
    { key: "creditos", label: "Pre-financiamiento", icon: <HandHold size={18} /> },
    { key: "vouchers", label: "Vouchers", icon: <ReceiptPaper size={18} /> },
    { key: "seguros", label: "Seguros climáticos", icon: <ShieldWeave size={18} /> },
    { key: "auditoria", label: "Auditoría", icon: <ClipboardCheckArt size={18} /> },
  ];

  const profiles = [
    { n: "Juana Quispe", score: 842, st: "Excelente", c: "var(--mint)" },
    { n: "Mario Condori", score: 731, st: "Bueno", c: "var(--gold)" },
    { n: "Coop. Maranganí", score: 690, st: "Estable", c: "var(--gold-soft)" },
    { n: "Elena Mamani", score: 588, st: "Atención", c: "var(--terracotta-soft)" },
  ];

  return (
    <DashShell
      role="Aliado financiero"
      title="Capital justo, riesgo medido."
      subtitle="Historial verificado de ventas, calidad y trazabilidad como base para crédito y seguros."
      accent="var(--teal-700)"
      onBack={onBack}
      sidebar={<SideNav items={nav} active={tab} onPick={setTab} />}
    >
      <div className="lg:hidden -mx-5 sm:-mx-8 px-5 sm:px-8 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {nav.map((it) => (
            <button key={it.key} onClick={() => setTab(it.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm ${tab === it.key ? "bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]" : "bg-[var(--paper)] border-[var(--ink)]/10"}`}>
              {it.icon}<span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
      {tab !== "inicio" ? (
        <>
          {tab === "scoring" && <ScoringTab />}
          {tab === "creditos" && <CreditosTab />}
          {tab === "vouchers" && <VouchersTab />}
          {tab === "seguros" && <SegurosTab />}
          {tab === "auditoria" && <AuditoriaTab />}
        </>
      ) : (
        <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: "Cartera activa · plataforma", v: `S/ ${(stats.activePortfolio / 1000).toFixed(1)}k`, s: `${stats.activeCreditsCount} aprobados`, bg: "var(--gold)" },
          { l: "Transacciones · plataforma", v: String(stats.totalVouchers), s: `${stats.pendingVouchers} en proceso`, bg: "var(--mint)" },
          { l: "Default rate (ref.)", v: "1.8%", s: "Referencia sectorial", bg: "var(--pink)" },
          { l: "Productores scoreados · plataforma", v: String(stats.scoredProducersCount), s: "Con score activo", bg: "var(--gold-soft)" },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ArtCard className="p-5">
              <div className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center mb-3" style={{ background: k.bg }}>
                <Vault size={20} />
              </div>
              <div className="font-display text-3xl" style={{ fontWeight: 600 }}>{k.v}</div>
              <div className="text-xs text-[var(--ink)]/60">{k.l}</div>
              <div className="font-mono text-[10px] uppercase text-[var(--ink)]/50 mt-1">{k.s}</div>
            </ArtCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <ArtCard className="lg:col-span-2 p-5">
          <SectionLabel n="N°01">Flujo de pre-financiamiento · S/ miles</SectionLabel>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={cashflow}>
                <defs>
                  <linearGradient id="finG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a5658" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#1a5658" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" stroke="#0d1f1e60" />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#0d1f1e", border: "none", color: "#fff", borderRadius: 12 }} />
                <Area dataKey="v" stroke="#1a5658" strokeWidth={2.5} fill="url(#finG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ArtCard>

        <ArtCard className="p-5 bg-[var(--gold)]/30">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink)]/60">Acción ahora</div>
          <div className="font-display text-2xl mt-2" style={{ fontWeight: 600 }}>{stats.pendingEvaluationsCount} solicitudes</div>
          <div className="text-sm text-[var(--ink)]/70 mt-1">
            {stats.pendingEvaluationsCount === 1 ? "solicitud pendiente de evaluación." : "solicitudes pendientes de evaluación."}
          </div>
          {stats.pendingEvaluationsCount > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-[var(--ivory)] border border-[var(--ink)]/10 text-xs text-[var(--ink)]/70">
              Revisá el detalle completo en la pestaña <span className="font-mono font-semibold">Pre-financiamiento</span>.
            </div>
          )}
          <button onClick={() => setQueueOpen((prev) => !prev)} className="mt-4 w-full px-4 py-3 rounded-full bg-[var(--ink)] text-[var(--ivory)] text-sm flex items-center justify-center gap-2" style={{ fontWeight: 500 }}>
            Revisar cola <TrendingUp className="w-4 h-4" />
          </button>
          {queueOpen && (
            <div className="mt-3 rounded-xl border border-[var(--ink)]/10 bg-[var(--ivory)] p-3 text-xs text-[var(--ink)]/70">
              Cola abierta: priorizá montos altos con score fuerte y trazabilidad completa antes de emitir pre-financiamiento.
            </div>
          )}
        </ArtCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionLabel n="N°02">Scoring de productores</SectionLabel>
          <div className="space-y-3">
            {profiles.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ArtCard className="p-4 flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" stroke="#0d1f1e15" strokeWidth="6" fill="none" />
                      <motion.circle
                        cx="32" cy="32" r="26"
                        stroke={p.c} strokeWidth="6" fill="none" strokeLinecap="round"
                        strokeDasharray={`${(p.score / 1000) * 163} 163`}
                        initial={{ strokeDasharray: "0 163" }}
                        animate={{ strokeDasharray: `${(p.score / 1000) * 163} 163` }}
                        transition={{ duration: 1.1, delay: i * 0.05 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-display text-sm" style={{ fontWeight: 700 }}>
                      {p.score}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg" style={{ fontWeight: 600 }}>{p.n}</div>
                    <div className="text-xs text-[var(--ink)]/60">Score basado en ventas + calidad + trazabilidad</div>
                  </div>
                  <span className="px-3 py-1 rounded-full border-2 border-[var(--ink)] text-[10px] font-mono uppercase tracking-wider" style={{ background: p.c }}>{p.st}</span>
                </ArtCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel n="N°03">Vouchers + seguros activos</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {[
              { t: "Voucher esquila", v: "S/ 1,200", i: <ReceiptPaper size={26} className="text-[var(--terracotta)]" />, c: "var(--pink)" },
              { t: "Pre-pago lote", v: "S/ 3,800", i: <Wallet className="w-6 h-6" />, c: "var(--gold)" },
              { t: "Seguro climático", v: "Activo", i: <ShieldWeave size={26} className="text-[var(--teal-700)]" />, c: "var(--mint)" },
              { t: "Comprobante venta", v: "12 hoy", i: <FileCheck className="w-6 h-6" />, c: "var(--gold-soft)" },
            ].map((v, i) => (
              <ArtCard key={i} className="p-4">
                <div className="w-12 h-12 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center" style={{ background: v.c }}>
                  {v.i}
                </div>
                <div className="font-display text-lg mt-3" style={{ fontWeight: 600 }}>{v.v}</div>
                <div className="text-xs text-[var(--ink)]/60">{v.t}</div>
              </ArtCard>
            ))}
          </div>

          <ArtCard className="p-5 mt-4 bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]">
            <div className="flex items-center gap-3">
              <Vault size={28} className="text-[var(--gold)]" />
              <div>
                <div className="font-display text-lg" style={{ fontWeight: 600 }}>Bóveda de garantías</div>
                <div className="text-xs text-[var(--ivory)]/70">7 productores · cobertura S/ 92,000</div>
              </div>
            </div>
          </ArtCard>
        </div>
      </div>
        </>
      )}
    </DashShell>
  );
}
