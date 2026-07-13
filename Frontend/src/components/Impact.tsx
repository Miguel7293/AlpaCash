import { Users, Weight, PackageCheck, Building2, FileBarChart } from "lucide-react";
import { useLanguage } from "@/lib/providers/LanguageProvider";

const metricMeta = [
  { icon: Users, value: "+" },
  { icon: Weight, value: "—" },
  { icon: PackageCheck, value: "—" },
  { icon: Building2, value: "—" },
  { icon: FileBarChart, value: "—" },
];

export function Impact() {
  const { t } = useLanguage();
  return (
    <section id="impacto" className="py-24 bg-[var(--ivory)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--terracotta)]">{t.impact.eyebrow}</div>
            <h2 className="mt-3 text-3xl sm:text-4xl tracking-tight text-[var(--teal-deep)]" style={{ fontWeight: 600, lineHeight: 1.15 }}>
              {t.impact.title}
            </h2>
          </div>
          <div className="text-sm text-[var(--muted-foreground)] max-w-xs">
            {t.impact.desc}
          </div>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {t.impact.metrics.map((label, i) => {
            const meta = metricMeta[i];
            return (
              <div key={label} className="bg-white rounded-2xl border border-[var(--border)] p-6 hover:border-[var(--gold)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[var(--ivory-2)] flex items-center justify-center text-[var(--teal-deep)]">
                  <meta.icon className="w-5 h-5" />
                </div>
                <div className="mt-5 text-4xl tracking-tight text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>
                  {meta.value}
                </div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)] leading-snug">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
