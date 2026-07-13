import { Globe, Check } from "lucide-react";
import { useLanguage } from "@/lib/providers/LanguageProvider";
import { LOCALES } from "@/lib/i18n/translations";

export function Languages() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <section className="py-20 bg-[var(--ivory)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[var(--teal-deep)] to-[var(--teal-700)] text-[var(--ivory)] p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-[var(--gold)]/20 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                <Globe className="w-3.5 h-3.5" /> {t.languages.eyebrow}
              </div>
              <h2 className="mt-3 text-3xl tracking-tight" style={{ fontWeight: 600, lineHeight: 1.15 }}>
                {t.languages.title}
              </h2>
              <p className="mt-3 text-[var(--ivory)]/75">
                {t.languages.desc}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {LOCALES.map((l) => {
                const active = locale === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => setLocale(l.code)}
                    className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
                      active
                        ? "bg-white/15 border-white/30 ring-2 ring-[var(--gold)]/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--ivory)] text-[var(--teal-deep)] flex items-center justify-center" style={{ fontWeight: 600 }}>
                        {l.code.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{l.nativeName}</div>
                      </div>
                    </div>
                    {active ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> {t.languages.active}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-[var(--ivory)]/70 border border-white/20">
                        {l.code.toUpperCase()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
