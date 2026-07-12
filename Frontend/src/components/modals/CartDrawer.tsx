"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { FiberBall, ReceiptPaper, StampSeal } from "../icons/AlpaIcons";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/hooks/useCart";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, total, removeItem, clearCart } = useCart();
  const { user, role } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const producers = useMemo(() => new Set(items.map((item) => item.prod)).size, [items]);

  const handleCheckout = async () => {
    setCheckoutError(null);

    if (!user) {
      setCheckoutError("Iniciá sesión para enviar una solicitud de compra.");
      return;
    }

    if (role !== "empresa") {
      setCheckoutError(
        role === "admin"
          ? "Los administradores no pueden realizar compras en el marketplace."
          : "Solo compradores registrados pueden enviar solicitudes de compra."
      );
      return;
    }

    setCheckoutLoading(true);
    try {
      const supabase = createClient();

      const { data: empresa, error: empError } = await supabase
        .from("empresas")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (empError || !empresa) {
        throw new Error("No encontramos tu registro de empresa. Verificá que tu perfil esté completo.");
      }

      // Spec: abort entire checkout if ANY item is missing DB identifiers.
      // Partial inserts with valid items risk silent FK violations on the
      // filtered-out items and corrupt transaction state.
      const missingIds = items.some((it) => !it.recordId || !it.productorId);
      if (missingIds) {
        setCheckoutError(
          "Algunos lotes no tienen datos completos. Quitálos del carrito e intentá de nuevo."
        );
        setCheckoutLoading(false);
        return;
      }

      const inserts = items.map((it) => ({
        lote_id: it.recordId,
        empresa_id: empresa.id,
        productor_id: it.productorId,
        estado: "pendiente",
      }));

      const { error: insertError } = await supabase
        .from("solicitudes_compra")
        .insert(inserts);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSubmitted(true);
      clearCart();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Error al procesar la solicitud. Intentá de nuevo.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[var(--ink)]/60 backdrop-blur-sm z-50" />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] z-50 bg-[var(--paper)] border-l-2 border-[var(--ink)] flex flex-col"
          >
            <div className="p-5 border-b-2 border-[var(--ink)]/10 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink)]/60">Carrito B2B</div>
                <div className="font-display text-2xl" style={{ fontWeight: 700 }}>{items.length} lotes</div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-3">
              {items.length === 0 ? (
                <ArtEmpty submitted={submitted} />
              ) : (
                items.map((it, i) => (
                  <motion.div
                    key={it.id}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl bg-[var(--ivory)] border-2 border-[var(--ink)] brutalist-shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--paper)] border-2 border-[var(--ink)] flex items-center justify-center">
                        <FiberBall size={22} className="text-[var(--terracotta)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink)]/50">{it.id}</div>
                        <div className="font-display" style={{ fontWeight: 600 }}>{it.cat} · {it.prod}</div>
                        <div className="text-xs text-[var(--ink)]/60 mt-0.5">{it.lb} lb · S/ {it.price}/lb · {it.origin}</div>
                      </div>
                      <button onClick={() => removeItem(it.id)} className="w-8 h-8 rounded-full bg-[var(--paper)] border border-[var(--ink)]/15 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dashed border-[var(--ink)]/15 flex items-center justify-between">
                      <span className="text-xs text-[var(--ink)]/60">Subtotal</span>
                      <span className="font-display text-lg" style={{ fontWeight: 700 }}>S/ {(it.lb * it.price).toFixed(2)}</span>
                    </div>
                  </motion.div>
                ))
              )}

              <div className="p-4 rounded-2xl bg-[var(--gold)]/30 border-2 border-[var(--ink)] flex items-center gap-3">
                <StampSeal size={28} className="text-[var(--terracotta-deep)]" />
                <div className="text-sm">
                  <span style={{ fontWeight: 600 }}>{producers || 0} productores verificados.</span> Pagos protegidos por escrow.
                </div>
              </div>
            </div>

             <div className="border-t-2 border-[var(--ink)]/10 p-5 bg-[var(--ink)] text-[var(--ivory)]">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--gold)]">Total</div>
                  <div className="font-display text-3xl" style={{ fontWeight: 700 }}>S/ {total.toFixed(2)}</div>
                </div>
                <div className="text-right text-xs text-[var(--ivory)]/60">
                  <ReceiptPaper size={20} className="inline text-[var(--gold)] mb-1" /><br/>
                  Comprobante al confirmar
                </div>
              </div>
              
              {checkoutError && (
                <div className="mt-3 text-xs text-[var(--terracotta)] bg-white/10 rounded-xl px-3 py-2 leading-snug">
                  {checkoutError}
                </div>
              )}

              <button
                disabled={!items.length || checkoutLoading}
                onClick={handleCheckout}
                className="mt-4 w-full px-5 py-3.5 rounded-full bg-[var(--terracotta)] text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 600 }}
              >
                {checkoutLoading ? "Procesando solicitud..." : <>Enviar solicitud de compra <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ArtEmpty({ submitted }: { submitted: boolean }) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--ivory)] border-2 border-dashed border-[var(--ink)]/15 text-center">
      <CheckCircle2 className="w-8 h-8 mx-auto text-[var(--teal-500)] mb-3" />
      <div className="font-display text-2xl" style={{ fontWeight: 600 }}>{submitted ? "Solicitud enviada" : "Carrito vacío"}</div>
      <div className="text-sm text-[var(--ink)]/60 mt-1">
        {submitted ? "El equipo comercial ya recibió tu solicitud y generará el comprobante." : "Añadí lotes desde Marketplace o desde la ficha del lote."}
      </div>
    </div>
  );
}
