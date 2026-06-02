"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone, Mail, Award, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

type ProfileDetails = {
  nombre: string;
  email: string | null;
  rol: string;
  telefono: string | null;
  estado: string;
  created_at: string;
};

export function ProfileModal({
  open,
  onClose,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open || !user) return;
    const userId = user.id;

    async function loadProfile() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("nombre, email, rol, telefono, estado, created_at")
          .eq("id", userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error("Error al cargar detalles de perfil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [open, user, supabase]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
      onClose();
    } catch {
      toast.error("Error al cerrar sesión");
    } finally {
      setSigningOut(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "activo":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "pendiente":
        return "bg-amber-50 text-amber-700 border-amber-300";
      case "suspendido":
        return "bg-red-50 text-red-700 border-red-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-300";
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    productor: "Productor",
    empresa: "Comprador empresa",
    financiera: "Entidad financiera",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--ink)]/70 backdrop-blur-sm z-[9999]"
          />
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed inset-0 m-auto max-w-md h-fit z-[10000] px-4"
          >
            <div className="bg-[var(--paper, #F7F5F0)] rounded-3xl border-2 border-[var(--ink)] brutalist-shadow overflow-hidden flex flex-col p-6 relative">
              {/* Tape strip effect */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-5 bg-[var(--gold)]/80 rotate-[-1.5deg] rounded-sm z-10" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-center hover:scale-105 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pt-4 flex flex-col items-center">
                {/* Avatar with double border */}
                <div className="relative p-1 rounded-full border-2 border-[var(--ink)] bg-white mb-4">
                  <Avatar className="size-20">
                    <AvatarFallback className="text-xl font-bold bg-[var(--gold-soft)] text-[var(--terracotta)]">
                      {profile ? getInitials(profile.nombre) : "??"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <h3 className="font-display text-2xl font-bold text-[var(--ink)] text-center">
                  {profile ? profile.nombre : "Cargando..."}
                </h3>

                {profile && (
                  <span className="mt-1 text-xs px-2.5 py-0.5 rounded-full border bg-[var(--gold-soft)] text-[var(--terracotta)] border-[var(--terracotta-soft)]/20 font-medium">
                    {roleLabels[profile.rol] || profile.rol}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-8 flex justify-center items-center">
                  <span className="w-3 h-3 rounded-full bg-[var(--terracotta)] animate-ping" />
                  <span className="ml-2 text-sm text-[var(--ink)]/70">Cargando detalles...</span>
                </div>
              ) : (
                profile && (
                  <div className="mt-6 space-y-4">
                    {/* Information Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--ink)]/10 bg-white">
                        <Mail className="w-4 h-4 text-[var(--teal-deep)]" />
                        <div>
                          <div className="text-[10px] font-mono uppercase text-[var(--ink)]/50">Correo Electrónico</div>
                          <div className="text-sm font-medium text-[var(--ink)]">{profile.email || "No registrado"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--ink)]/10 bg-white">
                        <Phone className="w-4 h-4 text-[var(--teal-deep)]" />
                        <div>
                          <div className="text-[10px] font-mono uppercase text-[var(--ink)]/50">Teléfono</div>
                          <div className="text-sm font-medium text-[var(--ink)]">{profile.telefono || "No registrado"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--ink)]/10 bg-white">
                        <Award className="w-4 h-4 text-[var(--teal-deep)]" />
                        <div>
                          <div className="text-[10px] font-mono uppercase text-[var(--ink)]/50">Estado de cuenta</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(profile.estado)}`}>
                              {profile.estado.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 flex gap-3">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-full border-2 border-[var(--ink)] font-medium hover:bg-[var(--ivory-2)] transition-colors text-sm"
                      >
                        Cerrar
                      </button>
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex-1 px-4 py-3 rounded-full bg-[var(--terracotta)] text-white font-medium hover:bg-[var(--terracotta-soft)] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                      >
                        <LogOut className="w-4 h-4" />
                        {signingOut ? "Saliendo..." : "Cerrar sesión"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
