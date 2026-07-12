"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, X, Globe, Search } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { AccountMenu } from "./AccountMenu";

export type NavTarget = "landing" | "marketplace" | "demo" | "prices" | "trust" | "profile" | "login" | "register";

export function PillNavbar({
  current,
  onNavigate,
  onLogin,
  onRegister,
}: {
  current: NavTarget;
  onNavigate: (t: NavTarget) => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"ES" | "EN">("ES");
  const [scrolled, setScrolled] = useState(false);
  const { user, nombre, role, loading, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: { key: NavTarget; label: string }[] = [
    { key: "marketplace", label: lang === "ES" ? "Marketplace" : "Market" },
    { key: "demo", label: lang === "ES" ? "Roles" : "Roles" },
    { key: "prices", label: lang === "ES" ? "Precios" : "Prices" },
    { key: "trust", label: lang === "ES" ? "Confianza" : "Trust" },
  ];

  return (
    <>
      {/* Vertical fade/blur behind floating nav elements — fades to transparent
          so the hard rectangular edge is replaced with a soft gradient veil.
          --ivory = #f4ede0; values are used directly for reliable cross-browser
          gradient rendering with opacity control. */}
      <div
        className={`fixed top-0 left-0 right-0 z-[45] pointer-events-none transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
        style={{
          height: "7rem",
          background:
            "linear-gradient(to bottom, rgba(244,237,224,0.9) 0%, rgba(244,237,224,0.65) 45%, transparent 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)",
        }}
      />

      {/* Logo top-left + lang top-right */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 pt-4 sm:pt-6 flex items-start justify-between">
          {/* Logo */}
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => onNavigate("landing")}
            className="pointer-events-auto flex items-center gap-2.5 group"
          >
            <div className="relative">
              <img src="/ALPACASH.svg" alt="AlpaCash" className="h-11 w-auto group-hover:scale-105 transition-transform" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--terracotta)] border-2 border-[var(--ivory)]" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-[20px] text-[var(--ink)] tracking-tight" style={{ fontWeight: 600 }}>
                AlpaCash
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink)]/60">
                est. 2026 · Puno PE
              </span>
            </div>
          </motion.button>

          {/* Lang + Search */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => onNavigate("marketplace")} className="w-10 h-10 rounded-full bg-[var(--ivory)] border border-[var(--ink)]/15 flex items-center justify-center text-[var(--ink)] hover:bg-white transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-1 py-1 rounded-full bg-[var(--ivory)] border border-[var(--ink)]/15">
              {(["ES", "EN"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    lang === l ? "bg-[var(--ink)] text-[var(--ivory)]" : "text-[var(--ink)]/70"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {l}
                </button>
              ))}
              <span className="px-2 text-[9px] text-[var(--ink)]/40 font-mono uppercase tracking-wider">AYM·soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Pill Nav (desktop) */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden lg:flex fixed top-5 left-1/2 -translate-x-1/2 z-50"
      >
        <div className={`flex items-center gap-1 p-1.5 rounded-full bg-[var(--ink)] text-[var(--ivory)] transition-all ${scrolled ? "shadow-2xl scale-[0.97]" : "shadow-xl"}`}>
          {links.map((l) => {
            const active = current === l.key;
            return (
              <button
                key={l.key}
                onClick={() => onNavigate(l.key)}
                className="relative px-5 py-2 rounded-full text-sm transition-colors"
                style={{ fontWeight: 500 }}
              >
                {active && (
                  <motion.span
                    layoutId="pill-active"
                    className="absolute inset-0 rounded-full bg-[var(--gold)]"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <span className={`relative ${active ? "text-[var(--ink)]" : "text-[var(--ivory)]/85 hover:text-[var(--ivory)]"}`}>
                  {l.label}
                </span>
              </button>
            );
          })}
          <div className="w-px h-5 bg-[var(--ivory)]/15 mx-1" />
          {loading ? (
            /* Skeleton prevents layout shift while auth resolves */
            <div className="w-28 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : user && nombre ? (
            <AccountMenu
              nombre={nombre}
              role={role}
              avatarUrl={user.user_metadata?.avatar_url ?? null}
              onSignOut={signOut}
              variant="pill"
            />
          ) : (
            <>
              <button
                onClick={onLogin}
                className="px-4 py-2 rounded-full text-sm text-[var(--ivory)]/85 hover:text-[var(--ivory)]"
                style={{ fontWeight: 500 }}
              >
                Ingresar
              </button>
              <button
                onClick={onRegister}
                className="px-5 py-2 rounded-full bg-[var(--terracotta)] hover:bg-[var(--terracotta-soft)] text-white text-sm transition-colors"
                style={{ fontWeight: 600 }}
              >
                Empezar →
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* Mobile menu trigger (floating bottom) */}
      <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="px-5 py-3 rounded-full bg-[var(--ink)] text-[var(--ivory)] shadow-2xl flex items-center gap-3"
          style={{ fontWeight: 500 }}
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="text-sm">Menú</span>
          <span className="w-px h-4 bg-white/20" />
          <span className="text-sm text-[var(--gold)]" style={{ fontWeight: 600 }}>Empezar</span>
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden fixed bottom-20 left-4 right-4 z-50 bg-[var(--ink)] text-[var(--ivory)] rounded-3xl p-5 shadow-2xl"
        >
          <div className="grid grid-cols-2 gap-2">
            {links.map((l) => (
              <button
                key={l.key}
                onClick={() => { onNavigate(l.key); setOpen(false); }}
                className="text-left px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10"
              >
                <div className="font-display text-lg">{l.label}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {loading ? (
              <div className="h-14 rounded-2xl bg-white/10 animate-pulse" />
            ) : user && nombre ? (
              <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3">
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-medium text-white">{nombre}</span>
                  {role && (
                    <span className="mt-0.5 text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--gold-soft, #F5EFE0)", color: "var(--terracotta, #B24D2A)" }}>
                      {role === "admin" ? "Administrador" : role === "productor" ? "Productor" : role === "empresa" ? "Comprador empresa" : "Entidad financiera"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { signOut(); setOpen(false); }}
                  className="text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-full border border-white/20"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => { onLogin(); setOpen(false); }} className="py-3 rounded-2xl border border-white/15 text-sm">Ingresar</button>
                <button onClick={() => { onRegister(); setOpen(false); }} className="py-3 rounded-2xl bg-[var(--terracotta)] text-white text-sm" style={{ fontWeight: 600 }}>Empezar →</button>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono uppercase text-[var(--ivory)]/40">
            <Globe className="w-3 h-3" /> ES · EN · AYM próximamente
          </div>
        </motion.div>
      )}
    </>
  );
}
