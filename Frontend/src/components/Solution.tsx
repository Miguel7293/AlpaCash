import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ClipboardCheck, ShieldCheck, Network } from "lucide-react";
import { useLanguage } from "@/lib/providers/LanguageProvider";

const stepMeta = [
  { icon: ClipboardCheck, n: "01", image: "https://images.unsplash.com/photo-1776951647310-5ff90544136a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900" },
  { icon: ShieldCheck, n: "02", image: "https://images.unsplash.com/photo-1770122985572-ca890ef5ecf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900" },
  { icon: Network, n: "03", image: "https://images.unsplash.com/photo-1741176505152-2470fc145dcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900" },
];

export function Solution() {
  const { t } = useLanguage();
  return (
    <section id="solucion" className="py-24 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--ivory-2)] to-[var(--ivory)]" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--terracotta)]">{t.solution.eyebrow}</div>
          <h2 className="mt-3 text-3xl sm:text-4xl tracking-tight text-[var(--teal-deep)]" style={{ fontWeight: 600, lineHeight: 1.15 }}>
            {t.solution.title}
          </h2>
          <p className="mt-4 text-[var(--teal-deep)]/70 leading-relaxed">
            {t.solution.desc}
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {t.solution.steps.map((s, i) => {
            const meta = stepMeta[i];
            return (
              <div key={meta.n} className="relative bg-white rounded-3xl border border-[var(--border)] overflow-hidden flex flex-col">
                <div className="relative aspect-[5/3] overflow-hidden">
                  <ImageWithFallback src={meta.image} alt={s.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--teal-deep)]/60 to-transparent" />
                  <div className="absolute top-4 left-4 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full text-xs text-[var(--teal-deep)]">{meta.n}</div>
                  <div className="absolute bottom-4 left-4 w-11 h-11 rounded-xl bg-[var(--gold)] flex items-center justify-center text-[var(--teal-deep)]">
                    <meta.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <h3 className="text-xl text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>{s.title}</h3>
                  <p className="mt-2 text-sm text-[var(--teal-deep)]/70 leading-relaxed">{s.body}</p>
                </div>
                {i < t.solution.steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 w-6 h-px bg-[var(--gold)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
