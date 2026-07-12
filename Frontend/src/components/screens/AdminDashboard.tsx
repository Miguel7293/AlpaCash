import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Area, AreaChart, XAxis } from "recharts";
import { AlertTriangle, Eye, Users, FileText } from "lucide-react";
import { DashShell, ArtCard, SectionLabel, SideNav } from "./DashShell";
import { ShieldWeave, ChartSparkle, Vault, ClipboardCheckArt, StampSeal, MountainPath, FiberBall } from "../icons/AlpaIcons";
import { UsersTab } from "./tabs/admin/UsersTab";
import { PoliciesTab } from "./tabs/admin/PoliciesTab";
import { LogsTab } from "./tabs/admin/LogsTab";
import { VaultTab } from "./tabs/admin/VaultTab";
import { AlertsTab } from "./tabs/admin/AlertsTab";
import { createClient } from "@/lib/supabase/client";

const traffic = Array.from({ length: 24 }).map((_, i) => ({ h: i, v: Math.round(40 + Math.sin(i / 3) * 30 + i * 1.6) }));

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const supabase = createClient();
  const [tab, setTab] = useState("inicio");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLots: 0,
  });
  const [splitData, setSplitData] = useState([
    { name: "Productores", v: 0, c: "#c4593a" },
    { name: "Compradores", v: 0, c: "#2a7a7c" },
    { name: "Financieras", v: 0, c: "#e8a838" },
    { name: "Administradores", v: 0, c: "#5a3a4f" },
  ]);
  const [validationQueue, setValidationQueue] = useState<{
    id: string;
    who: string;
    role: string;
    st: string;
  }[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: profiles, error: pError } = await supabase
          .from("profiles")
          .select("rol, estado");

        if (pError) throw pError;

        let prodCount = 0;
        let empCount = 0;
        let finCount = 0;
        let admCount = 0;
        let totalUsers = 0;

        if (profiles) {
          totalUsers = profiles.length;
          profiles.forEach((p: { rol: string | null; estado: string | null }) => {
            if (p.rol === "productor") prodCount++;
            else if (p.rol === "empresa") empCount++;
            else if (p.rol === "financiera") finCount++;
            else if (p.rol === "admin") admCount++;
          });
        }

        setSplitData([
          { name: "Productores", v: prodCount, c: "#c4593a" },
          { name: "Compradores", v: empCount, c: "#2a7a7c" },
          { name: "Financieras", v: finCount, c: "#e8a838" },
          { name: "Administradores", v: admCount, c: "#5a3a4f" },
        ]);

        const { count: lotesCount, error: lError } = await supabase
          .from("lotes_fibra")
          .select("id", { count: "exact", head: true });

        if (lError) throw lError;

        setStats({
          totalUsers,
          totalLots: lotesCount || 0,
        });

        const { data: pendingUsers, error: queueError } = await supabase
          .from("profiles")
          .select("id, nombre, rol, estado")
          .eq("estado", "pendiente")
          .order("created_at", { ascending: true });

        if (queueError) throw queueError;

        if (pendingUsers) {
          const roleLabels: Record<string, string> = {
            productor: "Productor",
            empresa: "Comprador",
            financiera: "Financiera",
            admin: "Administrador",
          };

          setValidationQueue(
            pendingUsers.map((u: { id: string; nombre: string; rol: string; estado: string }) => ({
              id: u.id.slice(0, 8).toUpperCase(),
              who: u.nombre,
              role: roleLabels[u.rol] || u.rol,
              st: "Pendiente validación",
            }))
          );
        }
      } catch (err) {
        console.error("Error loading admin stats:", err);
      }
    }

    loadStats();
  }, [supabase]);

  const nav = [
    { key: "inicio", label: "Panel", icon: <ChartSparkle size={18} /> },
    { key: "users", label: "Usuarios", icon: <Users className="w-[18px] h-[18px]" /> },
    { key: "policies", label: "Políticas", icon: <ShieldWeave size={18} /> },
    { key: "logs", label: "Auditoría", icon: <ClipboardCheckArt size={18} /> },
    { key: "vault", label: "Bóveda datos", icon: <Vault size={18} /> },
    { key: "alerts", label: "Alertas", icon: <AlertTriangle className="w-[18px] h-[18px]" /> },
  ];

  return (
    <DashShell
      role="Administrador / Operador"
      title="Sala de control."
      subtitle="Trazabilidad, accesos y salud de la red en una sola consola editorial."
      accent="var(--plum)"
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
          {tab === "users" && <UsersTab />}
          {tab === "policies" && <PoliciesTab />}
          {tab === "logs" && <LogsTab />}
          {tab === "vault" && <VaultTab />}
          {tab === "alerts" && <AlertsTab />}
        </>
      ) : (
        <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { l: "Usuarios totales", v: String(stats.totalUsers), s: "En red", bg: "var(--pink)" },
          { l: "Lotes en sistema", v: String(stats.totalLots), s: "Trazados", bg: "var(--mint)" },
          { l: "Consentimientos", v: "100%", s: "Activos", bg: "var(--gold)" },
          { l: "Incidentes 24h", v: "0", s: "Sistema OK", bg: "var(--gold-soft)" },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ArtCard className="p-5">
              <div className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center mb-3" style={{ background: k.bg }}>
                <ShieldWeave size={20} />
              </div>
              <div className="font-display text-3xl" style={{ fontWeight: 600 }}>{k.v}</div>
              <div className="text-xs text-[var(--ink)]/60">{k.l}</div>
              <div className="font-mono text-[10px] uppercase text-[var(--ink)]/50 mt-1">{k.s}</div>
            </ArtCard>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <ArtCard className="p-5">
          <SectionLabel n="N°01">Composición de la red</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={splitData} dataKey="v" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {splitData.map((s) => <Cell key={s.name} fill={s.c} stroke="#0d1f1e" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1f1e", border: "none", color: "#fff", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {splitData.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm border border-[var(--ink)]" style={{ background: s.c }} />
                <span className="flex-1">{s.name}</span>
                <span className="font-mono">{s.v}</span>
              </div>
            ))}
          </div>
        </ArtCard>

        <ArtCard className="lg:col-span-2 p-5">
          <SectionLabel n="N°02">Actividad 24h · accesos a fichas privadas</SectionLabel>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={traffic}>
                <defs>
                  <linearGradient id="adminG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5a3a4f" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#5a3a4f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" stroke="#0d1f1e60" />
                <Tooltip contentStyle={{ background: "#0d1f1e", border: "none", color: "#fff", borderRadius: 12 }} />
                <Area dataKey="v" stroke="#5a3a4f" strokeWidth={2.4} fill="url(#adminG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ArtCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionLabel n="N°03">Cola de validación</SectionLabel>
          {selectedUser && (
            <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--ivory)] px-4 py-3 text-sm text-[var(--teal-deep)]">
              Revisando expediente de {selectedUser}. Desde acá podés continuar la validación documental.
            </div>
          )}
          <div className="space-y-3">
            {validationQueue.length === 0 ? (
              <div className="text-sm text-[var(--ink)]/50 p-4 border-2 border-dashed border-[var(--ink)]/15 rounded-2xl text-center">
                No hay usuarios pendientes de validación.
              </div>
            ) : (
              validationQueue.map((u) => (
                <ArtCard key={u.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--gold)] border-2 border-[var(--ink)] flex items-center justify-center font-display" style={{ fontWeight: 700 }}>
                    {u.who ? u.who[0] : "?"}
                  </div>
                  <div className="flex-1">
                    <div className="font-display" style={{ fontWeight: 600 }}>{u.who}</div>
                    <div className="text-xs text-[var(--ink)]/60">{u.role} · <span className="font-mono">{u.id}</span></div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[var(--paper)] border-2 border-[var(--ink)]/15 text-[10px] font-mono uppercase">{u.st}</span>
                  <button onClick={() => setSelectedUser(u.who)} className="w-9 h-9 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-center"><Eye className="w-4 h-4" /></button>
                </ArtCard>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionLabel n="N°04">Bitácora de privacidad</SectionLabel>
          <div className="space-y-3">
            {[
              { t: "11:42", a: "Productor AC-2048 abrió ficha a 'Textiles Andina'", i: "consent" },
              { t: "10:18", a: "Aliado certificador firmó lote AC-2051", i: "stamp" },
              { t: "09:02", a: "Bóveda · backup verificado", i: "vault" },
              { t: "08:30", a: "3 nuevos productores se unieron en Puno", i: "users" },
            ].map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ArtCard className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center bg-[var(--ivory)]">
                    {l.i === "consent" && <ClipboardCheckArt size={20} className="text-[var(--terracotta)]" />}
                    {l.i === "stamp" && <StampSeal size={20} className="text-[var(--gold)]" />}
                    {l.i === "vault" && <Vault size={20} className="text-[var(--teal-500)]" />}
                    {l.i === "users" && <FiberBall size={20} className="text-[var(--plum)]" />}
                  </div>
                  <div className="flex-1 text-sm">{l.a}</div>
                  <span className="font-mono text-xs text-[var(--ink)]/50">{l.t}</span>
                </ArtCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--ink)]/40">
        <span><MountainPath size={14} className="inline mr-1" /> Sala central · Lima</span>
        <span><FileText className="inline w-3 h-3 mr-1" /> Política activa: confianza por nivel v3.2</span>
      </div>
        </>
      )}
    </DashShell>
  );
}
