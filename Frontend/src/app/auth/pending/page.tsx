import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_TO_ROUTE, type Role } from "@/lib/supabase/types";
import { PendingScreen } from "./PendingScreen";

// Maps self-service roles to their role-specific table.
// Used to detect whether the role row is present (profile complete)
// or still missing (send back to complete-profile).
const ROLE_TABLE_MAP: Partial<Record<string, string>> = {
  productor: "productores",
  empresa: "empresas",
  financiera: "entidades_financieras",
};

/**
 * Dedicated pending-activation page — lives at /auth/pending, outside the
 * dashboard layout so the proxy guard never runs and the session is preserved.
 *
 * Guards (server-side):
 * - No session → /auth/login
 * - No profile → /auth/complete-profile
 * - activo → role dashboard
 * - suspendido | rechazado → signOut → /auth/login?error=cuenta-{estado}
 * - pendiente + role row missing → /auth/complete-profile
 * - pendiente + role row present → render <PendingScreen /> (session intact)
 */
export default async function PendingActivationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, estado")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/complete-profile");
  }

  // Active user landed here by accident — send to their dashboard.
  if (profile.estado === "activo") {
    redirect(ROLE_TO_ROUTE[profile.rol as Role] ?? "/");
  }

  // Hard-blocked states: sign out and surface the error on the login page.
  if (profile.estado === "suspendido" || profile.estado === "rechazado") {
    await supabase.auth.signOut();
    redirect(`/auth/login?error=cuenta-${profile.estado}`);
  }

  // estado === "pendiente": verify role-specific row is present.
  // If missing, the user still needs to finish onboarding.
  const roleTable = ROLE_TABLE_MAP[profile.rol];
  if (roleTable) {
    const { data: roleRow } = await supabase
      .from(roleTable)
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!roleRow) {
      redirect("/auth/complete-profile");
    }
  }

  // Profile is complete and account is awaiting admin activation.
  // Session stays alive — do NOT call signOut.
  return <PendingScreen />;
}
