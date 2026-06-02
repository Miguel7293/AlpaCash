"use client";

import { useAuthContext } from "@/lib/providers/AuthProvider";
import type { User } from "@supabase/supabase-js";
import type { Role, Estado } from "@/lib/supabase/types";

type AuthState = {
  user: User | null;
  role: Role | null;
  estado: Estado | null;
  nombre: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  return useAuthContext();
}

