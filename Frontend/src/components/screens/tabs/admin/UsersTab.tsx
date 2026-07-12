"use client";

import { useState } from "react";
import { ArtCard, SectionLabel } from "../../DashShell";
import { useAdminUsers } from "@/lib/hooks/useDashboardData";

// ----- Types ---------------------------------------------------------------

type EstadoFilter = "pendiente" | "activo" | "suspendido" | "rechazado" | "todos";

const FILTER_OPTIONS: EstadoFilter[] = [
  "pendiente",
  "activo",
  "suspendido",
  "rechazado",
  "todos",
];

const FILTER_LABELS: Record<EstadoFilter, string> = {
  pendiente: "Pendientes",
  activo: "Activos",
  suspendido: "Suspendidos",
  rechazado: "Rechazados",
  todos: "Todos",
};

type ActionDef = {
  label: string;
  newEstado: string;
  variant: "approve" | "reject" | "suspend" | "reactivate";
};

function getActions(status: string): ActionDef[] {
  switch (status) {
    case "pendiente":
      return [
        { label: "Aprobar", newEstado: "activo", variant: "approve" },
        { label: "Rechazar", newEstado: "rechazado", variant: "reject" },
      ];
    case "activo":
      return [{ label: "Suspender", newEstado: "suspendido", variant: "suspend" }];
    case "suspendido":
      return [{ label: "Reactivar", newEstado: "activo", variant: "reactivate" }];
    default:
      return [];
  }
}

const ACTION_STYLES: Record<ActionDef["variant"], string> = {
  approve:
    "bg-[var(--teal-500)] text-[var(--ivory)] border-[var(--teal-500)] hover:opacity-80",
  reject:
    "bg-[var(--terracotta)] text-[var(--ivory)] border-[var(--terracotta)] hover:opacity-80",
  suspend:
    "bg-[var(--gold)] text-[var(--ink)] border-[var(--gold)] hover:opacity-80",
  reactivate:
    "bg-[var(--mint)] text-[var(--ink)] border-[var(--mint)] hover:opacity-80",
};

// ----- Component -----------------------------------------------------------

export function UsersTab() {
  const [filter, setFilter] = useState<EstadoFilter>("pendiente");
  const [pendingId, setPendingId] = useState<string | null>(null);

  // "todos" → no estado query param (backend returns all users)
  const apiFilter = filter === "todos" ? undefined : filter;

  const { users, loading, error, mutating, mutationError, updateUserEstado } =
    useAdminUsers(apiFilter);

  async function handleAction(userId: string, newEstado: string) {
    setPendingId(userId);
    try {
      await updateUserEstado(userId, newEstado);
    } catch {
      // mutationError state is already set inside updateUserEstado
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <SectionLabel n="N°01">Usuarios de la red</SectionLabel>

      {/* Estado filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={[
              "px-3 py-1 rounded-full border-2 text-[10px] font-mono uppercase transition-colors",
              filter === opt
                ? "bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]"
                : "bg-[var(--paper)] text-[var(--ink)] border-[var(--ink)]/20 hover:border-[var(--ink)]/40",
            ].join(" ")}
          >
            {FILTER_LABELS[opt]}
          </button>
        ))}
      </div>

      {/* Fetch error */}
      {error && (
        <ArtCard className="p-3 mb-3 text-sm text-[var(--terracotta)] border-[var(--terracotta)]/30">
          {error}
        </ArtCard>
      )}

      {/* Mutation error */}
      {mutationError && (
        <ArtCard className="p-3 mb-3 text-sm text-[var(--terracotta)] border-[var(--terracotta)]/30">
          {mutationError}
        </ArtCard>
      )}

      {/* Loading state */}
      {loading && (
        <ArtCard className="p-4 mb-3 text-sm text-[var(--ink)]/60">
          Cargando usuarios…
        </ArtCard>
      )}

      {/* Empty state */}
      {!loading && !error && users.length === 0 && (
        <ArtCard className="p-4 mb-3 text-sm text-[var(--ink)]/60">
          No hay usuarios{" "}
          {filter !== "todos"
            ? `en estado ${FILTER_LABELS[filter].toLowerCase()}`
            : "registrados"}
          .
        </ArtCard>
      )}

      {/* User list */}
      <div className="space-y-3">
        {users.map((user) => {
          const actions = getActions(user.status);
          const isThisPending = pendingId === user.id;

          return (
            <ArtCard
              key={user.id}
              className="p-4 flex items-center justify-between gap-3 flex-wrap"
            >
              {/* Identity */}
              <div className="min-w-0 flex-1">
                <div
                  className="font-display text-lg truncate"
                  style={{ fontWeight: 600 }}
                >
                  {user.name}
                </div>
                {user.email && (
                  <div className="text-xs text-[var(--ink)]/60 truncate">
                    {user.email}
                  </div>
                )}
                <div className="text-[10px] font-mono text-[var(--ink)]/40 mt-0.5">
                  {user.role}
                </div>
              </div>

              {/* Status badge + action buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <span className="px-3 py-1 rounded-full border-2 border-[var(--ink)]/15 bg-[var(--paper)] text-[10px] font-mono uppercase">
                  {user.status}
                </span>

                {actions.map((action) => (
                  <button
                    key={action.newEstado}
                    onClick={() => handleAction(user.id, action.newEstado)}
                    disabled={mutating || isThisPending}
                    className={[
                      "px-3 py-1 rounded-full border-2 text-[10px] font-mono uppercase transition-opacity",
                      ACTION_STYLES[action.variant],
                      mutating || isThisPending
                        ? "opacity-50 cursor-not-allowed"
                        : "",
                    ].join(" ")}
                  >
                    {isThisPending ? "…" : action.label}
                  </button>
                ))}
              </div>
            </ArtCard>
          );
        })}
      </div>
    </div>
  );
}
