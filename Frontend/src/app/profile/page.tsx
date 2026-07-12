"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Shield,
  Building2,
  Tractor,
  Landmark,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Settings,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Role, Estado } from "@/lib/supabase/types";

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  productor: "Productor",
  empresa: "Comprador empresa",
  financiera: "Entidad financiera",
};

const roleDescriptions: Record<Role, string> = {
  admin: "Tenés acceso completo a la plataforma para gestionar usuarios, políticas y auditorías.",
  productor: "Pertenecés a la red de productores de fibra de alpaca de Puno.",
  empresa: "Formás parte del ecosistema de empresas compradoras de fibra.",
  financiera: "Operás como entidad financiera dentro de la plataforma AlpaCash.",
};

const roleIcons: Record<Role, React.ReactNode> = {
  admin: <Shield size={20} />,
  productor: <Tractor size={20} />,
  empresa: <Building2 size={20} />,
  financiera: <Landmark size={20} />,
};

const estadoConfig: Record<Estado, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  activo: {
    label: "Activo",
    icon: <CheckCircle2 size={14} />,
    color: "var(--teal-700)",
    bg: "var(--mint)",
  },
  pendiente: {
    label: "Pendiente",
    icon: <Clock size={14} />,
    color: "var(--gold)",
    bg: "var(--gold-soft)",
  },
  suspendido: {
    label: "Suspendido",
    icon: <XCircle size={14} />,
    color: "var(--terracotta)",
    bg: "var(--terracotta-soft)",
  },
  rechazado: {
    label: "Rechazado",
    icon: <XCircle size={14} />,
    color: "var(--destructive)",
    bg: "#fecaca",
  },
};

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nombre.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: "var(--gold-soft)",
        color: "var(--terracotta-deep)",
        border: "1px solid var(--terracotta-soft)",
      }}
    >
      {roleIcons[role]}
      {roleLabels[role]}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: Estado }) {
  const config = estadoConfig[estado];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function ProfileCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-[var(--paper)] rounded-2xl border-2 border-[var(--ink)] brutalist-shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children, n }: { children: React.ReactNode; n?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {n && (
        <span className="font-display text-2xl text-[var(--terracotta)]" style={{ fontWeight: 700 }}>
          {n}
        </span>
      )}
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink)]/60">
        {children}
      </span>
      <span className="flex-1 h-px bg-[var(--ink)]/15" />
    </div>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--ink)]/10 last:border-0">
      <div
        className="w-10 h-10 rounded-xl border border-[var(--ink)]/15 flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--ivory)" }}
      >
        <span className="text-[var(--teal-700)]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink)]/50 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-[var(--ink)] truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function RoleSpecificSection({ role }: { role: Role }) {
  const router = useRouter();

  const sectionContent: Record<Role, React.ReactNode> = {
    admin: (
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink)]/70">
          Accedé a la consola de administración para gestionar usuarios, políticas de privacidad,
          auditoría del sistema y bóveda de datos.
        </p>
        <button
          onClick={() => router.push("/dashboard/administrador")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--ink)] text-[var(--ivory)] hover:bg-[var(--teal-700)] transition-colors group"
        >
          <span className="flex items-center gap-2 font-medium text-sm">
            <Shield size={16} />
            Ir a consola de administración
          </span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    ),
    productor: (
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink)]/70">
          Gestioná tus lotes de fibra, consultá ofertas de compradores y accedé a financiamiento.
        </p>
        <button
          onClick={() => router.push("/dashboard/productor")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--ink)] text-[var(--ivory)] hover:bg-[var(--teal-700)] transition-colors group"
        >
          <span className="flex items-center gap-2 font-medium text-sm">
            <Tractor size={16} />
            Ir a mi dashboard productivo
          </span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    ),
    empresa: (
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink)]/70">
          Explorá el marketplace de fibra, gestioná compras y accedé a financiamiento para tus operaciones.
        </p>
        <button
          onClick={() => router.push("/dashboard/comprador")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--ink)] text-[var(--ivory)] hover:bg-[var(--teal-700)] transition-colors group"
        >
          <span className="flex items-center gap-2 font-medium text-sm">
            <Building2 size={16} />
            Ir a mi dashboard comercial
          </span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    ),
    financiera: (
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink)]/70">
          Evaluá scoring de productores, gestioná créditos, seguros y vouchers dentro de la plataforma.
        </p>
        <button
          onClick={() => router.push("/dashboard/financiero")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--ink)] text-[var(--ivory)] hover:bg-[var(--teal-700)] transition-colors group"
        >
          <span className="flex items-center gap-2 font-medium text-sm">
            <Landmark size={16} />
            Ir a mi dashboard financiero
          </span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    ),
  };

  return (
    <ProfileCard className="p-5">
      <SectionLabel n="N°02">Acceso por rol</SectionLabel>
      {sectionContent[role]}
    </ProfileCard>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, nombre, role, estado, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ivory)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--ink)]/20 border-t-[var(--ink)] animate-spin" />
          <p className="font-mono text-xs text-[var(--ink)]/60 uppercase tracking-widest">
            Cargando perfil…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userEmail = user.email ?? null;

  return (
    <div className="min-h-screen bg-[var(--ivory)] text-[var(--ink)]">
      {/* Grain overlay */}
      <div className="fixed inset-0 grain pointer-events-none opacity-30" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[var(--ivory)]/90 backdrop-blur border-b-2 border-[var(--ink)]/10">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-center hover:bg-[var(--terracotta)] transition-colors"
            >
              <ArrowRight size={16} className="rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/ALPACASH.svg" alt="AlpaCash" className="h-9 w-auto" />
              <div className="hidden sm:block leading-none">
                <div className="font-display text-lg" style={{ fontWeight: 600 }}>
                  AlpaCash
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink)]/60">
                  Mi perfil
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[var(--ink)]/15 text-sm hover:bg-[var(--paper)] transition-colors"
            >
              <ArrowRight size={14} className="rotate-180" />
              <span className="hidden sm:inline">Volver al inicio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 pb-6"
      >
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[var(--ink)]/40" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink)]/60">
                Perfil de usuario
              </span>
            </div>
            <h1
              className="font-display text-[var(--ink)] leading-[0.95]"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 500 }}
            >
              Hola, {nombre ?? "Usuario"}. 👋
            </h1>
            <p className="font-editorial italic text-[var(--ink)]/70 mt-2 max-w-xl">
              Tu información personal y acceso a la plataforma AlpaCash.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--ink)]/50">
            <span className="w-2 h-2 rounded-full bg-emerald-600 live-dot" />
            Sesión activa
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 pb-20">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left column - Identity & Role sections */}
          <div className="space-y-6">
            {/* Identity Card */}
            <ProfileCard className="p-6">
              <SectionLabel n="N°01">Identidad</SectionLabel>

              <div className="flex items-start gap-5 mb-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0" style={{ padding: "3px" }}>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--ink)", opacity: 0.08 }}
                  />
                  <Avatar className="size-20">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url ?? undefined}
                      alt={nombre ?? "Usuario"}
                    />
                    <AvatarFallback
                      className="text-lg font-semibold"
                      style={{
                        background: "var(--gold-soft)",
                        color: "var(--terracotta-deep)",
                      }}
                    >
                      {nombre ? getInitials(nombre) : "??"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0 pt-1">
                  <h2
                    className="font-display text-2xl text-[var(--ink)] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {nombre ?? "—"}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {role && <RoleBadge role={role} />}
                    {estado && <EstadoBadge estado={estado} />}
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="bg-[var(--ivory)] rounded-xl p-4 -mx-1">
                <ProfileField
                  icon={<User size={18} />}
                  label="Nombre completo"
                  value={nombre}
                />
                <ProfileField
                  icon={<Mail size={18} />}
                  label="Correo electrónico"
                  value={userEmail}
                />
                <ProfileField
                  icon={<Shield size={18} />}
                  label="Rol en la plataforma"
                  value={role ? roleLabels[role] : null}
                />
                <ProfileField
                  icon={
                    estado === "activo" ? (
                      <CheckCircle2 size={18} />
                    ) : estado === "pendiente" ? (
                      <Clock size={18} />
                    ) : (
                      <XCircle size={18} />
                    )
                  }
                  label="Estado de cuenta"
                  value={estado ? estadoConfig[estado].label : null}
                />
              </div>
            </ProfileCard>

            {/* Role-specific section */}
            {role && <RoleSpecificSection role={role} />}
          </div>

          {/* Right column - Quick actions & Info */}
          <div className="space-y-6">
            {/* Quick actions */}
            <ProfileCard className="p-5">
              <SectionLabel n="N°03">Acciones rápidas</SectionLabel>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (role === "admin") router.push("/dashboard/administrador");
                    else if (role === "productor") router.push("/dashboard/productor");
                    else if (role === "empresa") router.push("/dashboard/comprador");
                    else if (role === "financiera") router.push("/dashboard/financiero");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--ivory)] transition-colors group text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl border border-[var(--ink)]/15 flex items-center justify-center"
                    style={{ background: "var(--gold-soft)" }}
                  >
                    <FileText size={18} className="text-[var(--terracotta-deep)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--ink)]">Ir a mi dashboard</p>
                    <p className="text-xs text-[var(--ink)]/50">Accedé a tu área de trabajo</p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-[var(--ink)]/40 group-hover:translate-x-1 group-hover:text-[var(--ink)] transition-all"
                  />
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors group text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl border border-red-200 flex items-center justify-center bg-red-50"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--destructive)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--ink)]">Cerrar sesión</p>
                    <p className="text-xs text-[var(--ink)]/50">Salir de la plataforma</p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-[var(--ink)]/40 group-hover:translate-x-1 group-hover:text-[var(--destructive)] transition-all"
                  />
                </button>
              </div>
            </ProfileCard>

            {/* Info card */}
            <ProfileCard className="p-5">
              <SectionLabel n="N°04">Acerca de tu cuenta</SectionLabel>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg border border-[var(--ink)]/15 flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--mint)" }}
                  >
                    <Shield size={14} className="text-[var(--teal-700)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--ink)]">
                      {role ? roleLabels[role] : "Sin rol asignado"}
                    </p>
                    <p className="text-xs text-[var(--ink)]/60 mt-0.5">
                      {role ? roleDescriptions[role] : "Completá tu perfil para obtener acceso."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg border border-[var(--ink)]/15 flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--gold-soft)" }}
                  >
                    <Clock size={14} className="text-[var(--terracotta-deep)]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--ink)]">
                      {estado ? estadoConfig[estado].label : "Sin estado"}
                    </p>
                    <p className="text-xs text-[var(--ink)]/60 mt-0.5">
                      {estado === "activo"
                        ? "Tu cuenta está activa y podés usar la plataforma."
                        : estado === "pendiente"
                          ? "Tu cuenta espera verificación. Recibirás un correo cuando esté lista."
                          : "Contactá a soporte para resolver este estado."}
                    </p>
                  </div>
                </div>
              </div>
            </ProfileCard>

            {/* Security note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--ivory)] border border-[var(--ink)]/10">
              <Settings size={16} className="text-[var(--ink)]/50 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--ink)]/60">
                Los cambios en tu perfil se sincronizan con todos los servicios de AlpaCash.
                Mantené tu información actualizada para garantizar el acceso correcto.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--ink)]/40">
          <span>AlpaCash · Puno, Perú</span>
          <span>Plataforma AgriTech-FinTech</span>
        </div>
      </div>
    </div>
  );
}
