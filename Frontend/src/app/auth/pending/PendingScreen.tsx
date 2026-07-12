"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { CheckCircle2, Clock } from "lucide-react";

const COMPLETION_STEPS = [
  "Perfil creado y guardado con éxito",
  "Documentación de rol registrada",
  "Revisión por el equipo en proceso",
];

/**
 * Pure UI component for the pending-activation state.
 * Marked "use client" so it can safely import AuthShell (which uses
 * ImageWithFallback → useState) from within a server-component page.
 */
export function PendingScreen() {
  return (
    <AuthShell
      eyebrow="Cuenta en revisión"
      quote="Nuestro equipo verifica cada perfil para mantener la confianza en la red alpaquera."
      image="https://images.unsplash.com/photo-1568805711729-f0cde40b5b9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
    >
      <div className="space-y-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-[var(--mint)]/40 p-5">
            <Clock className="w-10 h-10 text-[var(--teal-deep)]" />
          </div>
        </div>

        <div className="text-center">
          <h1
            className="text-2xl tracking-tight text-[var(--teal-deep)]"
            style={{ fontWeight: 600 }}
          >
            Perfil completado — en espera de activación
          </h1>
          <p className="mt-3 text-sm text-[var(--teal-deep)]/70 leading-relaxed">
            Tu perfil ya está listo. El equipo de AlpaCash lo revisará en las
            próximas horas. Cuando sea aprobado recibirás un correo y podrás
            ingresar normalmente.
          </p>
        </div>

        <ul className="space-y-3">
          {COMPLETION_STEPS.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-[var(--teal-deep)]/80"
            >
              <CheckCircle2 className="w-4 h-4 text-[var(--teal-deep)] mt-0.5 shrink-0" />
              {step}
            </li>
          ))}
        </ul>

        <p className="text-xs text-[var(--muted-foreground)] text-center">
          ¿Tenés preguntas? Escribinos a{" "}
          <a
            href="mailto:hola@alpacash.pe"
            className="text-[var(--terracotta)] hover:underline"
          >
            hola@alpacash.pe
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
