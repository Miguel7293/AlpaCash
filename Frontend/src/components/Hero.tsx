import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ArrowUpRight, ArrowRight, Star } from "lucide-react";
import { AlpacaHead, MountainPath, StampSeal, FiberBall } from "./icons/AlpaIcons";
import { useLanguage } from "@/lib/providers/LanguageProvider";

export function Hero({ onPrimary, onSecondary, onExplore }: { onPrimary?: () => void; onSecondary?: () => void; onExplore?: () => void }) {
  const { t } = useLanguage();
  return (
    <section className="relative pt-28 lg:pt-32 pb-12 lg:pb-20 bg-[var(--ivory)] overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 grain pointer-events-none opacity-60" />

      {/* Big editorial number */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 0.1, x: 0 }}
        transition={{ duration: 1.2 }}
        className="absolute -left-8 top-32 font-display text-[18rem] leading-none text-[var(--ink)]/8 select-none pointer-events-none hidden lg:block"
        style={{ fontWeight: 900 }}
      >
        N°01
      </motion.div>

      <div className="max-w-[1500px] mx-auto px-5 sm:px-8 relative">
        {/* Editorial meta strip */}
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--ink)]/60 mb-8 lg:mb-12">
          <span>{t.hero.editionLabel}</span>
          <span className="hidden sm:inline">{t.hero.altiplano}</span>
          <span>{t.hero.trustTag}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: type */}
          <div className="lg:col-span-7 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <h1 className="font-display text-[var(--ink)] leading-[0.92] tracking-[-0.02em]" style={{ fontWeight: 500, fontSize: "clamp(3rem, 9vw, 8rem)" }}>
                {t.hero.titleLine1}<br />
                {t.hero.titleWith && `${t.hero.titleWith} `}<em className="font-editorial text-[var(--terracotta)]" style={{ fontWeight: 400 }}>{t.hero.titleOrigin}</em>,<br />
                <span className="relative inline-block">
                  {t.hero.titleTrustWord}
                  <svg className="absolute -bottom-2 left-0 w-full" height="14" viewBox="0 0 400 14" preserveAspectRatio="none">
                    <path d="M2 7 C 80 1, 160 13, 240 6 S 398 9, 398 7" stroke="var(--gold)" strokeWidth="5" fill="none" strokeLinecap="round" />
                  </svg>
                </span><br />
                {t.hero.titleAnd && `${t.hero.titleAnd} `}<span className="font-editorial text-[var(--teal-500)]" style={{ fontWeight: 400 }}>{t.hero.titleValue}</span>.
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 lg:mt-10 max-w-xl space-y-6"
            >
              <p className="font-editorial text-xl lg:text-2xl text-[var(--ink)]/80 leading-snug italic">
                {t.hero.manifesto}
              </p>
              <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] text-[var(--ink)]/50">
                <span className="w-8 h-px bg-[var(--ink)]/30" />
                <span>{t.hero.manifestoLabel}</span>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={onPrimary}
                  className="group relative px-6 py-4 rounded-full bg-[var(--ink)] text-[var(--ivory)] flex items-center gap-3 hover:bg-[var(--terracotta)] transition-colors brutalist-shadow-sm"
                  style={{ fontWeight: 500 }}
                >
                  <span>{t.hero.ctaProducer}</span>
                  <span className="w-7 h-7 rounded-full bg-[var(--gold)] text-[var(--ink)] flex items-center justify-center group-hover:rotate-45 transition-transform">
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                  </span>
                </button>
                <button
                  onClick={onSecondary}
                  className="px-6 py-4 rounded-full bg-[var(--ivory)] text-[var(--ink)] border-2 border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--ivory)] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  {t.hero.ctaBuyer}
                </button>
                <button
                  onClick={onExplore}
                  className="group px-5 py-4 text-[var(--ink)] flex items-center gap-1.5"
                  style={{ fontWeight: 500 }}
                >
                  <span className="underline underline-offset-4 decoration-[var(--terracotta)] decoration-2 group-hover:decoration-[var(--teal-500)]">
                    {t.hero.ctaExplore}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--terracotta)] group-hover:translate-x-1 group-hover:text-[var(--teal-500)] transition-all" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right: editorial image + sticker cards */}
          <div className="lg:col-span-5 relative min-h-[480px] lg:min-h-[560px]">
            {/* Main image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="absolute top-0 right-0 w-[85%] aspect-[4/5] rounded-[2rem] overflow-hidden brutalist-shadow border-2 border-[var(--ink)] z-10"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1552474705-dd8183e00901?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
                alt="Productora alpaquera"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/40 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[var(--ivory)] text-[var(--ink)] font-mono text-[10px] uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--terracotta)] live-dot" /> {t.hero.imgBadge}
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-[var(--ivory)]">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--gold-soft)]">{t.hero.imgProducerTag}</div>
                <div className="font-display text-2xl mt-0.5" style={{ fontWeight: 500 }}>{t.hero.imgProducerName}</div>
              </div>
            </motion.div>

            {/* Floating lot card sticker */}
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="absolute -left-2 lg:left-0 bottom-12 w-[260px] z-20 sticker"
            >
              <div className="relative bg-[var(--paper)] rounded-2xl border-2 border-[var(--ink)] p-4 brutalist-shadow-sm">
                <div className="absolute -top-3 left-4 right-4 h-4 bg-[var(--gold)]/80 rounded-sm rotate-[-2deg]" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink)]/60">{t.hero.passportLabel}</div>
                    <div className="font-display text-2xl text-[var(--ink)] leading-none mt-1" style={{ fontWeight: 600 }}>{t.hero.passportCode}</div>
                  </div>
                  <StampSeal size={36} className="text-[var(--terracotta)]" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-[var(--ink)]/60">{t.hero.fieldCategory}</span><span className="text-right text-[var(--ink)]" style={{ fontWeight: 500 }}>{t.hero.fieldCategoryVal}</span>
                  <span className="text-[var(--ink)]/60">{t.hero.fieldColor}</span><span className="text-right text-[var(--ink)]" style={{ fontWeight: 500 }}>{t.hero.fieldColorVal}</span>
                  <span className="text-[var(--ink)]/60">{t.hero.fieldQty}</span><span className="text-right text-[var(--ink)] font-mono">{t.hero.fieldQtyVal}</span>
                  <span className="text-[var(--ink)]/60">{t.hero.fieldOrigin}</span><span className="text-right text-[var(--ink)]" style={{ fontWeight: 500 }}>{t.hero.fieldOriginVal}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-dashed border-[var(--ink)]/30 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700">● {t.hero.validated}</span>
                  <span className="font-mono text-xs text-[var(--ink)]">{t.hero.priceTag}</span>
                </div>
              </div>
            </motion.div>

            {/* Floating mini sticker - quality */}
            <motion.div
              initial={{ opacity: 0, rotate: 12, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 8, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute top-4 -right-4 lg:-right-8 z-20 floaty"
            >
              <div className="w-24 h-24 rounded-full bg-[var(--gold)] border-2 border-[var(--ink)] flex flex-col items-center justify-center text-[var(--ink)] text-center brutalist-shadow-sm">
                <Star className="w-4 h-4 fill-current" />
                <div className="font-display text-lg leading-none mt-0.5" style={{ fontWeight: 700 }}>{t.hero.stickerBaby}</div>
                <div className="font-mono text-[8px] uppercase tracking-wider">{t.hero.stickerAlpaca}</div>
              </div>
            </motion.div>

            {/* Mini producer pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute bottom-0 right-4 z-20 floaty-slow"
            >
              <div className="bg-[var(--ink)] text-[var(--ivory)] rounded-full pl-1 pr-4 py-1 flex items-center gap-2 brutalist-shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[var(--terracotta)] flex items-center justify-center">
                  <AlpacaHead size={18} className="text-[var(--ivory)]" />
                </div>
                <div className="text-xs">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--gold-soft)]">{t.hero.pillSales}</div>
                  <div className="leading-none" style={{ fontWeight: 500 }}>{t.hero.pillTraceability}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom credentials strip */}
        <div className="mt-14 lg:mt-20 pt-6 border-t-2 border-dashed border-[var(--ink)]/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[var(--ink)]/60 font-mono text-[10px] uppercase tracking-[0.2em]">
            <FiberBall size={16} className="text-[var(--terracotta)]" /> {t.hero.footDataProtected}
          </div>
          <div className="flex items-center gap-2 text-[var(--ink)]/60 font-mono text-[10px] uppercase tracking-[0.2em]">
            <MountainPath size={18} className="text-[var(--teal-500)]" /> {t.hero.footProducers}
          </div>
          <div className="flex items-center gap-2 text-[var(--ink)]/60 font-mono text-[10px] uppercase tracking-[0.2em]">
            <StampSeal size={16} className="text-[var(--gold)]" /> {t.hero.footCertifiers}
          </div>
        </div>
      </div>
    </section>
  );
}
