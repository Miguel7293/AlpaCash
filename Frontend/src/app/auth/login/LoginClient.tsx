"use client";

import { useEffect } from "react";
import { Login } from "@/components/auth/Login";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROLE_TO_ROUTE } from "@/lib/supabase/types";

/**
 * LoginClient wraps the Login form with an auth-aware session guard.
 *
 * Spec requirement: authenticated users MUST be redirected away from
 * /auth/login on direct navigation, browser back, and page reload.
 *
 * Pattern: render null while loading or while an active session exists
 * (redirect fires in the effect). The Login form only renders once we
 * know with certainty that no session is active.
 *
 * The landing page sends intent here first (e.g. /auth/login?role=producer)
 * so an already-registered visitor logs straight into their dashboard via
 * the redirect above. Only a visitor without an account needs "Crear cuenta",
 * so that link carries the same role through to the registration form.
 */
export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading } = useAuth();
  const intendedRole = searchParams.get("role");

  useEffect(() => {
    if (!loading && user) {
      const destination = role ? ROLE_TO_ROUTE[role] : "/";
      router.replace(destination);
    }
  }, [loading, user, role, router]);

  // Guard: do not render the login form while auth is resolving
  // or while a session is active (redirect is in flight)
  if (loading || user) return null;

  return (
    <Login
      onBack={() => router.push("/")}
      onRegister={() =>
        router.push(intendedRole ? `/auth/register?role=${encodeURIComponent(intendedRole)}` : "/auth/register")
      }
    />
  );
}
