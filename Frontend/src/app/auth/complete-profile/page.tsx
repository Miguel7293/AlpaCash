import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_TO_ROUTE, type Role } from "@/lib/supabase/types";
import { CompleteProfileForm } from "./CompleteProfileForm";

// Map each self-service role to its role-specific table and FK column.
// Used to detect the email-confirmation gap: profiles.rol set by trigger
// but role-specific row not yet created (Register.tsx skips RPC when
// data.session is null).
const ROLE_TABLE_MAP: Record<Exclude<Role, "admin">, string> = {
  productor: "productores",
  empresa: "empresas",
  financiera: "entidades_financieras",
};

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("rol, estado")
    .eq("id", user.id)
    .single();

  let initialRole: Exclude<Role, "admin"> | undefined;

  if (existing?.rol) {
    const rol = existing.rol as Role;

    // admin has no role-specific table — redirect immediately.
    if (rol === "admin") {
      redirect(ROLE_TO_ROUTE.admin);
    }

    // For self-service roles, verify the role-specific row also exists.
    // The email-confirmation gap: handle_new_user trigger sets profiles.rol,
    // but Register.tsx skips create_profile_with_role when no session is
    // available (email confirmation still pending). After confirmation the
    // user lands here — we must NOT redirect past the form; they still need
    // the role-specific row created by the RPC.
    const roleTable = ROLE_TABLE_MAP[rol as Exclude<Role, "admin">];
    const { data: roleRow } = await supabase
      .from(roleTable)
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (roleRow) {
      // Both profile and role-specific row exist — fully onboarded.
      // If still pending admin activation, go directly to login with the
      // activation message rather than bouncing through the dashboard.
      if (existing?.estado === "pendiente") {
        redirect("/auth/pending");
      }
      redirect(ROLE_TO_ROUTE[rol]);
    }

    // Role-specific row is missing: pre-fill the role in the form so the
    // user does not have to re-select what they already chose.
    initialRole = rol as Exclude<Role, "admin">;
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <CompleteProfileForm
      userId={user.id}
      email={user.email ?? ""}
      fullName={fullName}
      avatarUrl={avatarUrl}
      initialRole={initialRole}
    />
  );
}
