"use client";

import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Lock, MapPin, BadgeCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  usePublicMarketplaceLots,
  type PublicLotRecord,
} from "@/lib/hooks/useDashboardData";
import { useLanguage } from "@/lib/providers/LanguageProvider";

// ─── Display types ────────────────────────────────────────────

type Quality = "validated" | "review" | "certifiable";

const qualityStyles: Record<Quality, string> = {
  validated: "bg-emerald-50 text-emerald-700 border-emerald-100",
  review: "bg-amber-50 text-amber-700 border-amber-100",
  certifiable: "bg-sky-50 text-sky-700 border-sky-100",
};

// ─── Category → stock image mapping ──────────────────────────
// Deterministic per-category stock photos (same Unsplash shots as
// previous hardcoded cards). Images are decorative; real data comes
// from the database record fields.

const CATEGORY_IMAGES: Record<string, string> = {
  "Baby Alpaca":
    "https://images.unsplash.com/photo-1776951647310-5ff90544136a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  "Súper Baby":
    "https://images.unsplash.com/photo-1770122985572-ca890ef5ecf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  Fleece:
    "https://images.unsplash.com/photo-1598871956222-26b66d6559fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  "Médium Fleece":
    "https://images.unsplash.com/photo-1670764732222-e787bccd934f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  Huarizo:
    "https://images.unsplash.com/photo-1670764732222-e787bccd934f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1598871956222-26b66d6559fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900";

// ─── Mapping helpers ─────────────────────────────────────────

function toQuality(nivel: number | null): Quality {
  if (nivel !== null && nivel <= 2) return "validated";
  if (nivel !== null && nivel === 3) return "certifiable";
  return "review";
}

type DisplayLot = {
  code: string;
  image: string;
  category: string;
  quality: Quality;
  color: string;
  qty: string;
  region: string;
  price: string;
};

function toDisplayLot(lot: PublicLotRecord): DisplayLot {
  const category = lot.categoria ?? "Fibra";
  return {
    code: lot.codigo_lote ?? lot.id.slice(0, 8).toUpperCase(),
    image: CATEGORY_IMAGES[category] ?? FALLBACK_IMAGE,
    category,
    quality: toQuality(lot.nivel_calidad),
    color: lot.color ?? "Natural",
    qty: `${Math.round(lot.peso_libras ?? 0)} lb`,
    region: lot.region ?? "Puno",
    price: `S/ ${(lot.precio_por_libra ?? 0).toFixed(2)} / lb`,
  };
}

// ─── Skeleton card ────────────────────────────────────────────

function LotCardSkeleton() {
  return (
    <article className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-[4/3] bg-[var(--ivory-2)]" />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-4 bg-[var(--ivory-2)] rounded w-2/5" />
          <div className="h-4 bg-[var(--ivory-2)] rounded w-1/4" />
        </div>
        <div className="h-3 bg-[var(--ivory-2)] rounded w-3/4" />
        <div className="h-3 bg-[var(--ivory-2)] rounded w-1/2" />
        <div className="h-3 bg-[var(--ivory-2)] rounded w-2/3" />
        <div className="mt-auto h-9 bg-[var(--ivory-2)] rounded-full" />
      </div>
    </article>
  );
}

// ─── Component ────────────────────────────────────────────────

export function PublicMarketplace({ onExplore }: { onExplore?: () => void }) {
  const { t } = useLanguage();
  const { lots, loading, error } = usePublicMarketplaceLots();
  const displayLots = lots.slice(0, 4).map(toDisplayLot);

  const qualityLabels: Record<Quality, string> = {
    validated: t.marketplace.qualityValidated,
    review: t.marketplace.qualityReview,
    certifiable: t.marketplace.qualityCertifiable,
  };

  return (
    <section id="marketplace" className="py-24 bg-[var(--ivory)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--terracotta)]">
              {t.marketplace.eyebrow}
            </div>
            <h2
              className="mt-3 text-3xl sm:text-4xl tracking-tight text-[var(--teal-deep)]"
              style={{ fontWeight: 600, lineHeight: 1.15 }}
            >
              {t.marketplace.title}
            </h2>
            <p className="mt-4 text-[var(--teal-deep)]/70 leading-relaxed">
              {t.marketplace.desc}
            </p>
          </div>
          <Button
            onClick={onExplore}
            variant="ghost"
            className="text-[var(--teal-deep)] hover:bg-white rounded-full"
          >
            {t.marketplace.exploreAll} <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </div>

        {/* Cards grid — loading / error / data states */}
        {error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted-foreground)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">
              {t.marketplace.errorLoad}
            </span>
          </div>
        ) : loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <LotCardSkeleton key={i} />
            ))}
          </div>
        ) : displayLots.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
            <span className="text-sm">{t.marketplace.empty}</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayLots.map((l) => (
              <article
                key={l.code}
                className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--ivory-2)]">
                  <ImageWithFallback
                    src={l.image}
                    alt={`Lote ${l.code}`}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-xs text-[var(--teal-deep)]"
                    style={{ fontWeight: 500 }}
                  >
                    {l.category}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-[var(--teal-deep)]/85 text-[10px] text-[var(--ivory)] flex items-center gap-1 backdrop-blur">
                    <Lock className="w-3 h-3" /> {t.marketplace.protectedData}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div
                      className="text-[var(--teal-deep)]"
                      style={{ fontWeight: 600 }}
                    >
                      {t.marketplace.lot} {l.code}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${qualityStyles[l.quality]}`}
                    >
                      {qualityLabels[l.quality]}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-[var(--muted-foreground)]">{t.marketplace.color}</dt>
                    <dd className="text-right text-[var(--teal-deep)]">{l.color}</dd>
                    <dt className="text-[var(--muted-foreground)]">{t.marketplace.qty}</dt>
                    <dd className="text-right text-[var(--teal-deep)]">{l.qty}</dd>
                    <dt className="text-[var(--muted-foreground)]">{t.marketplace.origin}</dt>
                    <dd className="text-right text-[var(--teal-deep)] flex items-center justify-end gap-1">
                      <MapPin className="w-3 h-3 text-[var(--terracotta)]" />
                      {l.region}
                    </dd>
                  </dl>

                  <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                        {t.marketplace.refPrice}
                      </div>
                      <div
                        className="text-[var(--teal-deep)]"
                        style={{ fontWeight: 600 }}
                      >
                        {l.price}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--teal-deep)]/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                      {t.marketplace.statusAvailable}
                    </div>
                  </div>

                  <button
                    onClick={onExplore}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-[var(--ivory-2)] hover:bg-[var(--gold-soft)]/40 text-[var(--teal-deep)] text-sm transition-colors"
                  >
                    <BadgeCheck className="w-4 h-4" /> {t.marketplace.viewInfo}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-[var(--muted-foreground)] text-center">
          {t.marketplace.footNote}
        </p>
      </div>
    </section>
  );
}
