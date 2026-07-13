import { Layers3, ShieldQuestion, LineChart } from "lucide-react";
import { useLanguage } from "@/lib/providers/LanguageProvider";

const icons = [Layers3, ShieldQuestion, LineChart];

export function Problem() {
  const { t } = useLanguage();
  return (
    <section id="problema" className="py-24 bg-[var(--ivory)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--terracotta)]">{t.problem.eyebrow}</div>
          <h2 className="mt-3 text-3xl sm:text-4xl tracking-tight text-[var(--teal-deep)]" style={{ fontWeight: 600, lineHeight: 1.15 }}>
            {t.problem.title}
          </h2>
          <p className="mt-4 text-[var(--teal-deep)]/70 leading-relaxed">
            {t.problem.desc}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {t.problem.items.map((it, i) => {
            const Icon = icons[i];
            return (
              <div key={it.title} className="group bg-white rounded-2xl border border-[var(--border)] p-7 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[var(--ivory-2)] flex items-center justify-center text-[var(--terracotta)] group-hover:bg-[var(--terracotta)] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>{it.title}</h3>
                <p className="mt-2 text-sm text-[var(--teal-deep)]/70 leading-relaxed">{it.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
