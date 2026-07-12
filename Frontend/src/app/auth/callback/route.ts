import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_TO_ROUTE, type Role } from "@/lib/supabase/types";

// Maps each self-service role to its role-specific table.
// Used to detect the email-confirm gap: profiles.rol set by trigger
// but role-specific row not yet created (Register.tsx skips the RPC
// when data.session is null immediately after signUp).
const ROLE_TABLE_MAP: Partial<Record<string, string>> = {
  productor: "productores",
  empresa: "empresas",
  financiera: "entidades_financieras",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Resolvémos el origin público dinámicamente para reverse proxies (Render, Vercel)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.RENDER_EXTERNAL_URL?.trim();
  
  const origin = envUrl
    ? (envUrl.startsWith("http") ? envUrl : `https://${envUrl}`).replace(/\/+$/, "")
    : (host && !host.includes("localhost") ? `${proto}://${host}` : new URL(request.url).origin);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_user`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, estado")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.redirect(`${origin}/auth/complete-profile`);
  }

  // Hard-block: suspended or rejected accounts are always denied.
  if (profile.estado === "suspendido" || profile.estado === "rechazado") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/login?error=cuenta-${profile.estado}`);
  }

  // Pending accounts: allow through to complete-profile if the role-specific
  // row is still missing (email-confirmation gap — Register.tsx skipped the
  // RPC because data.session was null when signUp returned).
  if (profile.estado === "pendiente") {
    const roleTable = ROLE_TABLE_MAP[profile.rol];
    if (roleTable) {
      const { data: roleRow } = await supabase
        .from(roleTable)
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!roleRow) {
        // Role row missing — send to complete-profile to finish onboarding.
        // Session stays alive so the RPC can fire as auth.uid().
        return NextResponse.redirect(`${origin}/auth/complete-profile`);
      }
    }
    // Role row exists (or admin) — account is pending admin activation.
    // Preserve the session and redirect to the dedicated pending page.
    return NextResponse.redirect(`${origin}/auth/pending`);
  }

  const destination = ROLE_TO_ROUTE[profile.rol as Role] ?? "/";
  return NextResponse.redirect(`${origin}${destination}`);
}
