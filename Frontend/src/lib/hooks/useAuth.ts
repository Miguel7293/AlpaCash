"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role, Estado } from "@/lib/supabase/types";
import { getSupabaseEnv } from "@/lib/supabase/env";

type AuthState = {
  user: User | null;
  role: Role | null;
  estado: Estado | null;
  nombre: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  // Initialize loading to false when Supabase is not configured — avoids a
  // synchronous setState inside the effect body which triggers cascading renders.
  // When configured, loading starts as true and is resolved by the auth callbacks.
  const [loading, setLoading] = useState(() => getSupabaseEnv().isConfigured);

  useEffect(() => {
    if (!getSupabaseEnv().isConfigured) {
      // loading is already false from the useState initializer above
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        if (!cancelled) {
          setRole(null);
          setEstado(null);
          setNombre(null);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("rol, estado, nombre")
        .eq("id", currentUser.id)
        .single();

      if (cancelled) return;

      if (profile) {
        setRole(profile.rol as Role);
        setEstado(profile.estado as Estado);
        setNombre(profile.nombre as string);
      } else {
        setRole(null);
        setEstado(null);
        setNombre(null);
      }
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      await loadProfile(data.user);
      if (!cancelled) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      if (cancelled) return;
      setUser(nextUser);
      await loadProfile(nextUser);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (getSupabaseEnv().isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, []);

  return { user, role, estado, nombre, loading, signOut };
}
