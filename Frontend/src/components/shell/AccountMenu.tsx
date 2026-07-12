"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { User, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/supabase/types";

type AccountMenuProps = {
  nombre: string;
  role: Role | null;
  avatarUrl?: string | null;
  onSignOut: () => Promise<void>;
  variant?: "pill" | "header";
};

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  productor: "Productor",
  empresa: "Comprador empresa",
  financiera: "Entidad financiera",
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
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
      style={{
        background: "var(--gold-soft, #F5EFE0)",
        color: "var(--terracotta, #B24D2A)",
        border: "1px solid var(--terracotta-soft, rgba(178,77,42,0.2))",
      }}
    >
      {roleLabels[role]}
    </span>
  );
}

function getVariantStyles(variant: "pill" | "header") {
  if (variant === "header") {
    return {
      triggerClass:
        "flex items-center gap-2.5 px-3 py-2 rounded-full border border-[var(--ink)]/10 bg-white/80 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md",
      avatarSize: "size-8",
      nameClass: "text-sm font-medium text-[var(--ink)]",
      badgePosition: "mt-0.5",
      wrapper: "",
    };
  }
  // pill variant — for use inside the floating pill nav
  return {
    triggerClass:
      "flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors duration-200",
    avatarSize: "size-7",
    nameClass: "text-sm font-medium text-[var(--ivory)]",
    badgePosition: "mt-0.5",
    wrapper: "",
  };
}

export function AccountMenu({
  nombre,
  role,
  avatarUrl,
  onSignOut,
  variant = "pill",
}: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const styles = getVariantStyles(variant);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`${styles.triggerClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]`}
          aria-label="Account menu"
        >
          {/* Double-bezel avatar */}
          <div
            className="relative flex-shrink-0"
            style={{ padding: "2px" }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "var(--ink)",
                opacity: 0.08,
              }}
            />
            <Avatar className={styles.avatarSize}>
              <AvatarImage src={avatarUrl ?? undefined} alt={nombre} />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{
                  background: "var(--gold-soft, #F5EFE0)",
                  color: "var(--terracotta, #B24D2A)",
                }}
              >
                {getInitials(nombre)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name + role */}
          <div className="flex flex-col items-start leading-none">
            <span className={styles.nameClass}>{nombre}</span>
            {role && (
              <span className={styles.badgePosition}>
                <RoleBadge role={role} />
              </span>
            )}
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            } ${variant === "header" ? "text-[var(--ink)]/60" : "text-[var(--ivory)]/60"}`}
          />
        </button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {open && (
          <DropdownMenuContent asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="mt-2 min-w-[200px] rounded-2xl border border-[var(--border)] bg-white p-1.5 shadow-xl"
              style={{ zIndex: 999 }}
            >
              {/* User info header */}
              <div className="px-3 py-3 rounded-xl mb-1.5" style={{ background: "var(--ivory-2)" }}>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={avatarUrl ?? undefined} alt={nombre} />
                    <AvatarFallback
                      className="text-xs font-semibold"
                      style={{
                        background: "var(--gold-soft, #F5EFE0)",
                        color: "var(--terracotta, #B24D2A)",
                      }}
                    >
                      {getInitials(nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-none">
                    <p className="text-sm font-semibold text-[var(--ink)]">{nombre}</p>
                    {role && <RoleBadge role={role} />}
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="my-1.5 -mx-0.5" />

              {/* Profile link */}
              <DropdownMenuItem
                className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-[var(--ivory)] transition-colors"
                onClick={() => {
                  setOpen(false);
                  router.push("/profile");
                }}
              >
                <User className="w-4 h-4 mr-2.5 text-[var(--teal-deep)]" />
                <span className="text-sm text-[var(--ink)]">Mi perfil</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1.5 -mx-0.5" />

              {/* Logout */}
              <DropdownMenuItem
                className="rounded-xl px-3 py-2.5 cursor-pointer hover:bg-red-50 transition-colors data-[variant=destructive]:hover:bg-red-50"
                variant="destructive"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <LogOut className="w-4 h-4 mr-2.5" />
                <span className="text-sm">
                  {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                </span>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}