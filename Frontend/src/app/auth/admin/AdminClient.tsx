"use client";

import { useEffect } from "react";
import { Login } from "@/components/auth/Login";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROLE_TO_ROUTE } from "@/lib/supabase/types";

const ADMIN_EYEBROW = "Panel de administración";
const ADMIN_QUOTE = "Acceso restringido al equipo administrativo de AlpaCash.";
const ADMIN_IMAGE =
  "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";

/**
 * AdminClient wraps the admin-flavored Login form with an auth-aware
 * session guard.
 *
 * Spec requirement: authenticated users MUST be redirected away from
 * /auth/admin on direct navigation, browser back, and page reload.
 *
 * Admin users → /dashboard/administrador
 * Non-admin authenticated users → their role-specific dashboard
 */
export function AdminClient() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const destination = role ? ROLE_TO_ROUTE[role] : "/";
      router.replace(destination);
    }
  }, [loading, user, role, router]);

  // Guard: do not render the admin login form while auth is resolving
  // or while a session is active (redirect is in flight)
  if (loading || user) return null;

  return (
    <Login
      onBack={() => router.push("/")}
      onRegister={() => router.push("/auth/register")}
      adminEyebrow={ADMIN_EYEBROW}
      adminQuote={ADMIN_QUOTE}
      adminImage={ADMIN_IMAGE}
    />
  );
}
