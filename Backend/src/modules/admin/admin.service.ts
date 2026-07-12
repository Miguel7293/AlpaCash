import { supabaseAdmin } from "../../config/supabase";

export type AdminUserDetail = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  created_at: string;
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  pendiente: ["activo", "rechazado"],
  activo: ["suspendido"],
  suspendido: ["activo"],
};

export async function listUsers(filters?: {
  estado?: string;
}): Promise<{ users: AdminUserDetail[] }> {
  let query = supabaseAdmin
    .from("profiles")
    .select("id, nombre, email, rol, estado, created_at")
    .order("created_at", { ascending: false });

  if (filters?.estado) {
    query = query.eq("estado", filters.estado);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al obtener usuarios: ${error.message}`);
  }

  return { users: (data as AdminUserDetail[]) ?? [] };
}

export async function getUser(
  id: string
): Promise<{ user: AdminUserDetail }> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, nombre, email, rol, estado, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error("Usuario no encontrado");
  }

  return { user: data as AdminUserDetail };
}

export type EstadoTransitionError = {
  type: "not_found" | "invalid_transition";
  current?: string;
  requested?: string;
};

export async function updateEstado(
  id: string,
  newEstado: string
): Promise<{ id: string; estado: string } | { transitionError: EstadoTransitionError }> {
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("id, estado")
    .eq("id", id)
    .single();

  if (fetchError || !profile) {
    return { transitionError: { type: "not_found" } };
  }

  const currentEstado: string = profile.estado;
  const allowedTargets = VALID_TRANSITIONS[currentEstado] ?? [];

  if (!allowedTargets.includes(newEstado)) {
    return {
      transitionError: {
        type: "invalid_transition",
        current: currentEstado,
        requested: newEstado,
      },
    };
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ estado: newEstado })
    .eq("id", id)
    .select("id, estado")
    .single();

  if (updateError || !updated) {
    throw new Error(`Error al actualizar estado: ${updateError?.message}`);
  }

  return { id: updated.id as string, estado: updated.estado as string };
}
