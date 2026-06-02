"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "motion/react";
import { X, Heart, ShoppingCart, CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { StampSeal, FiberBall, MountainPath, ShieldWeave, ScaleBalance, ClipboardCheckArt } from "../icons/AlpaIcons";
import { useCart } from "@/lib/hooks/useCart";
import { useAuth } from "@/lib/hooks/useAuth";
import { AuthRequireModal } from "./AuthRequireModal";

import { useFavorites } from "@/lib/hooks/useFavorites";
import { toast } from "sonner";

export type DisplayLot = {
  id: string;
  cat: string;
  color?: string;
  origin: string;
  lb: number;
  price: number;
  prod: string;
  grade?: string;
  /** lotes_fibra.id — REQUIRED for checkout; absent means lot cannot be purchased */
  recordId?: string;
  /** productores.id — REQUIRED for checkout FK on solicitudes_compra */
  productorId?: string;
};

const fallbackLot: DisplayLot = {
  id: "AC-2048",
  cat: "Baby Alpaca",
  color: "Blanco crudo",
  origin: "Tinta, Puno",
  lb: 120,
  price: 32.5,
  prod: "Juana Quispe · Asoc. Tinta",
  grade: "A",
};

export function LotDetailModal({ open, onClose, lot }: { open: boolean; onClose: () => void; lot?: DisplayLot | null }) {
  const item = lot ?? fallbackLot;
  const { addItem, items } = useCart();
  const added = items.some((cartItem) => cartItem.id === item.id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = item.recordId ? isFavorite(item.recordId) : false;
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();

  const handleAdd = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    addItem({
      id: item.id,
      cat: item.cat,
      origin: item.origin,
      lb: item.lb,
      price: item.price,
      prod: item.prod,
      grade: item.grade,
      // Propagate DB identifiers required for checkout FK validation
      recordId: item.recordId,
      productorId: item.productorId,
    });
  };

  const handleToggleFavorite = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (item.recordId) {
      toggleFavorite(item.recordId);
    } else {
      toast.error("Este lote no se puede guardar como favorito porque no tiene un ID de base de datos.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--ink)]/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto sm:max-w-4xl sm:max-h-[90vh] z-50 overflow-hidden"
          >
            <div className="bg-[var(--paper)] sm:rounded-3xl rounded-t-3xl border-2 border-[var(--ink)] brutalist-shadow overflow-hidden max-h-[92vh] flex flex-col">
              {/* Tape strip */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-5 bg-[var(--gold)]/80 rotate-[-2deg] rounded-sm z-10" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-auto">
                <div className="grid sm:grid-cols-2 gap-0">
                  {/* Image side */}
                  <div className="relative h-72 sm:h-auto bg-[var(--ivory)]">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1598871956222-26b66d6559fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                      alt="Lote alpaca"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-12 left-4 px-3 py-1.5 rounded-full bg-[var(--ivory)] border-2 border-[var(--ink)] font-mono text-[10px] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 live-dot" /> Validado · grado A
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 aspect-square rounded-lg border-2 border-[var(--ink)] bg-[var(--paper)] overflow-hidden">
                          <ImageWithFallback
                            src={`https://images.unsplash.com/photo-${["1552474705-dd8183e00901","1568805711729-f0cde40b5b9d","1546182990-dffeafbe841d"][i-1]}?w=200&q=70`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info side */}
                  <div className="p-6 sm:p-8 space-y-5">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink)]/60">Pasaporte de lote</div>
                      <h2 className="font-display text-4xl mt-1" style={{ fontWeight: 700 }}>{item.id}</h2>
                      <div className="font-editorial italic text-[var(--ink)]/70 mt-1">&ldquo;Fibra baby alpaca, esquila de mayo, lote único.&rdquo;</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ["Categoría", item.cat],
                        ["Color", item.color ?? "Blanco crudo"],
                        ["Finura", "22.3 µm"],
                        ["Cantidad", `${item.lb} lb`],
                        ["Origen", item.origin],
                        ["Altitud", "4127 msnm"],
                      ].map(([k, v]) => (
                        <div key={k} className="p-3 rounded-xl bg-[var(--ivory)] border border-[var(--ink)]/10">
                          <div className="text-[10px] font-mono uppercase text-[var(--ink)]/50">{k}</div>
                          <div className="mt-0.5" style={{ fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--gold)]">Precio referencia</div>
                        <div className="font-display text-3xl mt-1" style={{ fontWeight: 700 }}>S/ {item.price.toFixed(2)}<span className="text-base text-[var(--ivory)]/60">/lb</span></div>
                      </div>
                      <StampSeal size={48} className="text-[var(--gold)]" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { i: <ShieldWeave size={16} />, t: "Trazado por nivel" },
                        { i: <ClipboardCheckArt size={16} />, t: "Consentido" },
                        { i: <MountainPath size={16} />, t: "Origen verificado" },
                        { i: <ScaleBalance size={16} />, t: "Pesado calibrado" },
                      ].map((b, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-[var(--paper)] border-2 border-[var(--ink)]/20 text-xs flex items-center gap-2">
                          {b.i} {b.t}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAdd} disabled={added} className="flex-1 px-5 py-3.5 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center justify-center gap-2 disabled:opacity-60" style={{ fontWeight: 500 }}>
                        {added ? <><CheckCircle2 className="w-4 h-4" /> Añadido</> : <><ShoppingCart className="w-4 h-4" /> Añadir al carrito</>}
                      </button>
                      <button onClick={handleToggleFavorite} className={`px-4 py-3.5 rounded-full border-2 border-[var(--ink)] ${favorite ? "bg-[var(--terracotta)] text-white border-[var(--terracotta)]" : "hover:bg-[var(--ivory-2)]"}`}>
                        <Heart className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-10 h-10 rounded-full bg-[var(--terracotta)] flex items-center justify-center">
                        <FiberBall size={20} className="text-[var(--ivory)]" />
                      </div>
                      <div>
                        <div className="text-sm" style={{ fontWeight: 600 }}>{item.prod}</div>
                        <div className="text-xs text-[var(--ink)]/60">8 ventas · 4.9★ · responde en 2h</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
      <AuthRequireModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
