"use client";

import { motion } from "motion/react";
import { ReactNode, useState } from "react";
import { ArrowLeft, Bell, Search } from "lucide-react";
import { useNotifications } from "@/lib/hooks/useDashboardData";
import { useAuth } from "@/lib/hooks/useAuth";
import { AccountMenu } from "@/components/shell/AccountMenu";

export function DashShell({
  role,
  title,
  subtitle,
  onBack,
  children,
  sidebar,
}: {
  role: string;
  title: string;
  subtitle: string;
  /** @deprecated The accent color was used for the legacy "JQ" avatar.
   *  Kept in props for backward compatibility; currently unused. */
  accent?: string;
  onBack: () => void;
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useNotifications();
  const { user, nombre, role: userRole, loading: authLoading, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-[var(--ivory)] text-[var(--ink)]">
      <div className="absolute inset-0 grain pointer-events-none opacity-40" />


      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[var(--ivory)]/90 backdrop-blur border-b-2 border-[var(--ink)]/10">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-center hover:bg-[var(--terracotta)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/ALPACASH.svg" alt="AlpaCash" className="h-9 w-auto" />
              <div className="hidden sm:block leading-none">
                <div className="font-display text-lg" style={{ fontWeight: 600 }}>AlpaCash</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink)]/60">{role}</div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--paper)] border-2 border-[var(--ink)]/10 w-full">
              <Search className="w-4 h-4 text-[var(--ink)]/50" />
              <input
                onFocus={() => setSearchOpen(true)}
                placeholder="Buscar lotes, productores, vouchers…"
                className="bg-transparent outline-none text-sm flex-1"
              />
              <span className="font-mono text-[10px] text-[var(--ink)]/40">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setNotificationsOpen((prev) => !prev)} className="relative w-10 h-10 rounded-full bg-[var(--paper)] border-2 border-[var(--ink)]/10 flex items-center justify-center">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--terracotta)] border-2 border-[var(--ivory)]" />
            </button>
            {authLoading ? (
              /* Skeleton while auth resolves — prevents layout shift */
              <div className="w-10 h-10 rounded-full bg-[var(--paper)] border-2 border-[var(--ink)]/10 animate-pulse" />
            ) : user && nombre ? (
              <AccountMenu
                nombre={nombre}
                role={userRole}
                avatarUrl={user.user_metadata?.avatar_url ?? null}
                onSignOut={signOut}
                variant="header"
              />
            ) : null}
          </div>
        </div>
      </header>

      {/* Title strip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-[1500px] mx-auto px-5 sm:px-8 pt-8 pb-4"
      >
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-px bg-[var(--ink)]/40" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink)]/60">{role} · Dashboard en vivo</span>
            </div>
            <h1 className="font-display text-[var(--ink)] leading-[0.95]" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 500 }}>
              {title}
            </h1>
            <p className="font-editorial italic text-[var(--ink)]/70 mt-2 max-w-xl">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--ink)]/50">
            <span className="w-2 h-2 rounded-full bg-emerald-600 live-dot" />
            sesión segura · ed. {new Date().toLocaleDateString("es-PE")}
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1500px] mx-auto px-5 sm:px-8 pb-20 relative">
        {searchOpen && (
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--ivory)] px-4 py-3 text-sm text-[var(--teal-deep)]">
            Búsqueda contextual habilitada. Escribí términos clave para filtrar lotes, productores o vouchers dentro del dashboard.
          </div>
        )}
        {notificationsOpen && (
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--ivory)] px-4 py-3 text-sm text-[var(--teal-deep)]">
            <div className="font-medium mb-2">Notificaciones recientes</div>
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div>Sin notificaciones nuevas.</div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id}>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-[var(--ink)]/70">{item.body}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <div className={sidebar ? "grid lg:grid-cols-[260px_1fr] gap-8" : ""}>
          {sidebar && <aside className="hidden lg:block">{sidebar}</aside>}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ArtCard({ children, className = "", rotate = 0 }: { children: ReactNode; className?: string; rotate?: number }) {
  return (
    <div
      className={`relative bg-[var(--paper)] rounded-2xl border-2 border-[var(--ink)] brutalist-shadow-sm ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, n }: { children: ReactNode; n?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {n && <span className="font-display text-2xl text-[var(--terracotta)]" style={{ fontWeight: 700 }}>{n}</span>}
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink)]/60">{children}</span>
      <span className="flex-1 h-px bg-[var(--ink)]/15" />
    </div>
  );
}

export function SideNav({ items, active, onPick }: { items: { key: string; label: string; icon: ReactNode }[]; active: string; onPick: (k: string) => void }) {
  return (
    <div className="space-y-1 sticky top-24">
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <button
            key={it.key}
            onClick={() => onPick(it.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all border-2 ${
              isActive ? "bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]" : "bg-transparent border-transparent hover:bg-[var(--paper)] hover:border-[var(--ink)]/10"
            }`}
          >
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? "bg-[var(--gold)] text-[var(--ink)]" : "bg-[var(--paper)] text-[var(--ink)]"}`}>
              {it.icon}
            </span>
            <span className="text-sm" style={{ fontWeight: 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
