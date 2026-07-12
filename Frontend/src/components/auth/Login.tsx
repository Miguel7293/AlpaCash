"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "./AuthShell";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_TO_ROUTE } from "@/lib/supabase/types";
import type { Role } from "@/lib/supabase/types";

// Maps self-service roles to role-specific tables — used to detect the
// email-confirm gap and redirect to complete-profile instead of blocking.
const ROLE_TABLE_MAP: Partial<Record<string, string>> = {
  productor: "productores",
  empresa: "empresas",
  financiera: "entidades_financieras",
};
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getAuthCallbackUrl } from "@/lib/supabase/redirect";
import { isValidEmail } from "@/lib/forms/validation";

const VALID_ROLES: Role[] = ["productor", "empresa", "admin", "financiera"];

export function Login({
  onBack,
  onRegister,
  adminEyebrow,
  adminQuote,
  adminImage,
}: {
  onBack?: () => void;
  onRegister?: () => void;
  adminEyebrow?: string;
  adminQuote?: string;
  adminImage?: string;
}) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const env = getSupabaseEnv();
  const authErrorCode = searchParams.get("error");
  const registered = searchParams.get("registered") === "1";

  const authMessage = registered
    ? "Cuenta creada. Revisá tu correo para verificarla y esperá la activación del equipo antes de ingresar."
    : authErrorCode === "cuenta-pendiente"
      ? "Tu cuenta existe pero todavía está pendiente de activación."
      : authErrorCode === "cuenta-suspendido"
        ? "Tu cuenta está suspendida. Contactá al equipo de AlpaCash."
        : authErrorCode === "cuenta-rechazado"
          ? "Tu cuenta fue rechazada. Contactá al equipo de AlpaCash."
          : authErrorCode === "callback_failed"
            ? "Falló la autenticación. Intentá de nuevo."
            : authErrorCode === "missing_code"
              ? "Faltó el código de autenticación al volver del proveedor de login."
              : authErrorCode === "no_user"
                ? "No pudimos recuperar tu usuario luego del login."
                : authErrorCode === "no-profile"
                  ? "Tu cuenta necesita completar perfil antes de ingresar."
                  : null;

  async function handleGoogle() {
    setError(null);
    if (!env.isConfigured) {
      setError("Falta configurar Supabase. Revisá las variables de entorno del servicio o Frontend/.env.local.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = getAuthCallbackUrl();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          ...(redirectTo ? { redirectTo } : {}),
        },
      });
      if (oauthError) {
        setError(`Google: ${oauthError.message}`);
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? `Error: ${err.message}` : "Error inesperado con Google.");
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError(null);

    if (!env.isConfigured) {
      setError("Falta configurar Supabase. Revisá las variables de entorno del servicio o Frontend/.env.local.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Ingresá tu correo para enviarte el enlace de recuperación.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = getAuthCallbackUrl();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        ...(redirectTo ? { redirectTo } : {}),
      });

      if (resetError) {
        setError(`No se pudo enviar la recuperación: ${resetError.message}`);
        return;
      }

      setError("Te enviamos un enlace de recuperación a tu correo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!env.isConfigured) {
      setError("Falta configurar Supabase. Revisá las variables de entorno del servicio o Frontend/.env.local.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError("Sesión iniciada pero no se pudo identificar al usuario.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("rol, estado")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        if (profileError && profileError.code !== 'PGRST116') {
          setError(`Error DB al cargar perfil: ${profileError.message} (${profileError.code})`);
          return;
        }
        router.push("/auth/complete-profile");
        return;
      }

      if (profile.estado === "pendiente") {
        // Email-confirm gap recovery: if the role-specific row is still missing,
        // send the user to complete-profile so the RPC can create it.
        // Session is active (password login succeeded), so auth.uid() will work.
        const roleTable = ROLE_TABLE_MAP[profile.rol];
        if (roleTable) {
          const { data: roleRow } = await supabase
            .from(roleTable)
            .select("id")
            .eq("profile_id", userId)
            .maybeSingle();
          if (!roleRow) {
            router.push("/auth/complete-profile");
            return;
          }
        }
        // Role row exists — account is pending admin activation.
        // Session is preserved; navigate to the dedicated pending page.
        router.push("/auth/pending");
        return;
      }

      if (profile.estado === "suspendido" || profile.estado === "rechazado") {
        await supabase.auth.signOut();
        setError(`Tu cuenta está ${profile.estado}. Contactá al equipo para reactivarla.`);
        return;
      }

      const role = profile.rol as Role;
      if (!VALID_ROLES.includes(role)) {
        setError("El rol de tu cuenta no es válido. Contactá al equipo.");
        return;
      }

      router.push(ROLE_TO_ROUTE[role]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      onBack={onBack}
      eyebrow={adminEyebrow ?? "Confianza · Trazabilidad"}
      quote={adminQuote ?? "Bienvenido de vuelta a tu red de confianza comercial alpaquera."}
      image={adminImage ?? "https://images.unsplash.com/photo-1568805711729-f0cde40b5b9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"}
    >
      <div>
        <h1 className="text-3xl tracking-tight text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>Ingresa a AlpaCash</h1>
        <p className="mt-2 text-sm text-[var(--teal-deep)]/70">
          Productores, compradores y aliados con una sola cuenta segura.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email" className="text-[var(--teal-deep)]">Correo</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                id="email"
                type="text"
                placeholder="tu@correo.pe"
                className="pl-9 h-11 bg-white border-[var(--border)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pass" className="text-[var(--teal-deep)]">Contraseña</Label>
              <button type="button" onClick={handlePasswordReset} className="text-xs text-[var(--terracotta)] hover:underline">¿Olvidaste?</button>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                id="pass"
                type={show ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10 h-11 bg-white border-[var(--border)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--terracotta)] bg-[var(--pink)]/30 rounded-xl px-4 py-3">{error}</p>
          )}

          {!error && authMessage && (
            <p className="text-sm text-[var(--teal-deep)] bg-[var(--mint)]/30 rounded-xl px-4 py-3">
              {authMessage}
            </p>
          )}

          {!error && authErrorCode === "no-profile" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/auth/complete-profile")}
              className="w-full h-11 rounded-full border-[var(--teal-deep)] text-[var(--teal-deep)] hover:bg-[var(--mint)]/20"
            >
              Completar perfil
            </Button>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[var(--teal-deep)] hover:bg-[var(--teal-700)] text-[var(--ivory)] disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>

          <div className="relative my-2">
            <div className="h-px bg-[var(--border)]" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[var(--ivory)] px-3 text-xs text-[var(--muted-foreground)]">o continúa con</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={loading || !env.isConfigured}
            className="w-full h-11 rounded-full border-[var(--border)] bg-white text-[var(--teal-deep)] disabled:opacity-60"
          >
            <Mail className="w-4 h-4 mr-2" /> {loading ? "Conectando…" : "Continuar con Google"}
          </Button>

        </form>

        <p className="mt-8 text-center text-sm text-[var(--teal-deep)]/80">
          ¿Aún no tienes cuenta?{" "}
          <button onClick={onRegister} className="text-[var(--terracotta)] hover:underline" style={{ fontWeight: 500 }}>
            Crear cuenta
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
