"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/lib/providers/AuthProvider";
import { toast } from "sonner";

interface FavoritesContextType {
  favoriteIds: string[];
  isFavorite: (loteId: string) => boolean;
  toggleFavorite: (loteId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

/**
 * FavoritesProvider — single source of truth for the current user's favorited lots.
 *
 * Mount once at the root (inside AuthProvider) so that every consumer
 * (Marketplace cards, LotDetailModal heart button, header count) reads from
 * the same state and stays in sync without additional DB round-trips.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [favoriteIds, _setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * favoriteIdsRef always mirrors the latest favoriteIds value.
   * This lets toggleFavorite read current state without closing over
   * the stale snapshot from the last render — eliminates the race condition
   * on rapid repeated clicks.
   */
  const favoriteIdsRef = useRef<string[]>([]);

  /**
   * Wrapper that keeps the ref in sync on every state update.
   * Uses the functional-updater form internally so callers can pass either
   * a plain array (full replace) or an updater function (relative mutation).
   */
  const setFavoriteIds = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      _setFavoriteIds((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        favoriteIdsRef.current = next;
        return next;
      });
    },
    []
  );

  /**
   * Per-loteId in-flight guard.
   * If a DB request for a given lot is already pending, subsequent clicks
   * are ignored rather than queued — prevents duplicate inserts / deletes
   * that would hit the unique constraint and produce confusing rollbacks.
   */
  const pendingRef = useRef(new Set<string>());

  useEffect(() => {
    if (!user) {
      // Use microtask to avoid calling setState synchronously in the effect body
      Promise.resolve().then(() => {
        setFavoriteIds((prev) => (prev.length > 0 ? [] : prev));
      });
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    const currentUser = user; // capture for async closure — user is non-null here (guarded above)

    async function fetchFavorites() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("lotes_favoritos")
          .select("lote_id")
          .eq("profile_id", currentUser.id);

        if (cancelled) return;
        if (error) throw error;
        if (data) {
          setFavoriteIds(data.map((fav: { lote_id: string }) => fav.lote_id));
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
        if (!cancelled) toast.error("Error al cargar favoritos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFavorites();
    return () => {
      cancelled = true;
    };
  }, [user, setFavoriteIds]);

  const isFavorite = useCallback(
    (loteId: string) => favoriteIds.includes(loteId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (loteId: string) => {
      if (!user) {
        toast.error("Debes iniciar sesión para guardar favoritos.");
        return;
      }

      // Block double-tap / rapid re-click for the same lot
      if (pendingRef.current.has(loteId)) return;
      pendingRef.current.add(loteId);

      // Read current truth from the ref — always reflects the latest state
      // even if the component has not re-rendered yet (avoids stale-closure bug)
      const wasFavorite = favoriteIdsRef.current.includes(loteId);

      // Optimistic update — shared across all consumers immediately
      setFavoriteIds((prev) =>
        wasFavorite ? prev.filter((id) => id !== loteId) : [...prev, loteId]
      );

      const supabase = createClient();

      try {
        if (wasFavorite) {
          const { error } = await supabase
            .from("lotes_favoritos")
            .delete()
            .eq("profile_id", user.id)
            .eq("lote_id", loteId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("lotes_favoritos")
            .insert({ profile_id: user.id, lote_id: loteId });
          if (error) throw error;
        }
      } catch (err) {
        console.error("Error toggling favorite:", err);
        toast.error("Error al actualizar favorito");
        // Re-fetch authoritative state from DB instead of rolling back from a
        // potentially stale snapshot — this is safe because the pending guard
        // ensures at most one concurrent request per lot.
        try {
          const { data } = await supabase
            .from("lotes_favoritos")
            .select("lote_id")
            .eq("profile_id", user.id);
          if (data) {
            setFavoriteIds(data.map((fav: { lote_id: string }) => fav.lote_id));
          }
        } catch {
          // Last resort: revert the optimistic update using the value we captured above
          setFavoriteIds((prev) =>
            wasFavorite ? [...prev, loteId] : prev.filter((id) => id !== loteId)
          );
        }
      } finally {
        pendingRef.current.delete(loteId);
      }
    },
    // favoriteIds removed from deps — we read from favoriteIdsRef instead
    [user, setFavoriteIds]
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (ctx === undefined) {
    throw new Error("useFavoritesContext must be used within a FavoritesProvider");
  }
  return ctx;
}
