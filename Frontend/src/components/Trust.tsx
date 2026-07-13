import { Lock, Eye, FileText, UserCheck, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/lib/providers/LanguageProvider";

const levelMeta = [
  { icon: Eye, color: "bg-[var(--ivory-2)] text-[var(--teal-deep)]" },
  { icon: UserCheck, color: "bg-[var(--ivory-2)] text-[var(--teal-deep)]" },
  { icon: BadgeCheck, color: "bg-[var(--gold-soft)]/40 text-[var(--teal-deep)]" },
  { icon: FileText, color: "bg-[var(--terracotta)]/15 text-[var(--terracotta)]" },
  { icon: Lock, color: "bg-[var(--teal-deep)] text-[var(--ivory)]" },
];

export function Trust() {
  const { t } = useLanguage();
  return (
    <section id="confianza" className="py-24 bg-[var(--teal-deep)] text-[var(--ivory)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "22px 22px"
      }} />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--gold-soft)]">{t.trust.eyebrow}</div>
          <h2 className="mt-3 text-3xl sm:text-4xl tracking-tight" style={{ fontWeight: 600, lineHeight: 1.15 }}>
            {t.trust.title}
          </h2>
          <p className="mt-4 text-[var(--ivory)]/75 leading-relaxed">
            {t.trust.desc}
          </p>
          <div className="mt-8 inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
            <Lock className="w-4 h-4 text-[var(--gold-soft)]" />
            <span className="text-sm text-[var(--ivory)]/85">{t.trust.banner}</span>
          </div>
        </div>

        <div className="lg:col-span-7 relative">
          <div className="space-y-3">
            {t.trust.levels.map((lv, i) => {
              const meta = levelMeta[i];
              return (
                <div
                  key={lv.label}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 transition-all"
                  style={{ marginLeft: `${i * 14}px` }}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                    <meta.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[var(--ivory)]" style={{ fontWeight: 600 }}>{lv.label}</div>
                    <div className="text-sm text-[var(--ivory)]/70">{lv.desc}</div>
                  </div>
                  <div className="text-xs text-[var(--ivory)]/50">{t.trust.levelPrefix} {i + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
