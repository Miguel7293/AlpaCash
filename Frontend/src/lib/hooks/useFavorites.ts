"use client";

/**
 * useFavorites — context-backed hook.
 *
 * All state lives in FavoritesProvider (mounted once at the root).
 * Every caller shares the same favoriteIds list so toggling a lot in
 * LotDetailModal is immediately reflected in Marketplace cards and the
 * header heart/count without any extra DB round-trips.
 */
export { useFavoritesContext as useFavorites } from "@/lib/providers/FavoritesProvider";
