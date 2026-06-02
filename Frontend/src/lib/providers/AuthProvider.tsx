"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { Role, Estado } from "@/lib/supabase/types";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type AuthContextType = {
  user: User | null;
  role: Role | null;
  estado: Estado | null;
  nombre: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => getSupabaseEnv().isConfigured);

  const clearAuth = useCallback(() => {
    setUser(null);
    setRole(null);
    setEstado(null);
    setNombre(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (getSupabaseEnv().isConfigured) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Error signing out from Supabase:", err);
    } finally {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, [clearAuth]);

  useEffect(() => {
    if (!getSupabaseEnv().isConfigured) {
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        if (!cancelled) {
          clearAuth();
        }
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("rol, estado, nombre")
          .eq("id", currentUser.id)
          .single();

        if (cancelled) return;

        if (error) {
          if (error.code === "PGRST116") {
            // Row not found — new user mid-registration; middleware already redirects
            // to /auth/complete-profile. Keep user alive so that page can access auth.
            setRole(null);
            setEstado(null);
            setNombre(null);
          } else {
            // Transient fetch error (network, DB timeout, etc.) — do NOT force logout.
            // Keep the session intact; the user will see limited profile data until
            // the next auth state change triggers a fresh profile fetch.
            console.warn("Transient profile fetch error — preserving session:", error.message);
            setRole(null);
            setEstado(null);
            setNombre(null);
          }
        } else if (!profile) {
          // Guard: null data with no error (shouldn't happen, but be safe)
          setRole(null);
          setEstado(null);
          setNombre(null);
        } else {
          setRole(profile.rol as Role);
          setEstado(profile.estado as Estado);
          setNombre(profile.nombre as string);
        }
      } catch (err) {
        // Unexpected exception — preserve session to avoid false logout on transient issues
        console.error("Failed to load profile:", err);
        if (!cancelled) {
          setRole(null);
          setEstado(null);
          setNombre(null);
        }
      }
    }

    // Initialize user and session
    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;

        if (error || !data?.user) {
          // Fallback to unauthenticated state on token refresh error
          clearAuth();
          if (!cancelled) setLoading(false);
          return;
        }

        setUser(data.user);
        await loadProfile(data.user);
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return;

      const nextUser = session?.user ?? null;
      if (!nextUser) {
        clearAuth();
        setLoading(false);
        return;
      }

      setUser(nextUser);
      setLoading(true);
      await loadProfile(nextUser);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ user, role, estado, nombre, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
