import { Sprout, Factory, LayoutDashboard, Landmark, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/providers/LanguageProvider";

export type RolesRoleId = "producer" | "buyer" | "admin" | "financial";

const roleMeta: {
  id: RolesRoleId;
  icon: typeof Sprout;
  accent: string;
  bg: string;
}[] = [
  { id: "producer", icon: Sprout, accent: "bg-[var(--gold)] text-[var(--teal-deep)]", bg: "from-[var(--ivory)] to-[var(--gold-soft)]/30" },
  { id: "buyer", icon: Factory, accent: "bg-[var(--terracotta)] text-white", bg: "from-[var(--ivory)] to-[var(--terracotta)]/15" },
  { id: "admin", icon: LayoutDashboard, accent: "bg-[var(--alpaca-brown)] text-white", bg: "from-[var(--ivory)] to-[var(--alpaca-brown)]/20" },
  { id: "financial", icon: Landmark, accent: "bg-sky-600 text-white", bg: "from-[var(--ivory)] to-sky-100" },
];

export function Roles({ onPick }: { onPick?: (roleId: RolesRoleId) => void }) {
  const { t } = useLanguage();
  return (
    <section id="como" className="py-24 bg-[var(--ivory-2)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--terracotta)]">{t.roles.eyebrow}</div>
          <h2 className="mt-3 text-3xl sm:text-4xl tracking-tight text-[var(--teal-deep)]" style={{ fontWeight: 600, lineHeight: 1.15 }}>
            {t.roles.title}
          </h2>
          <p className="mt-4 text-[var(--teal-deep)]/70">
            {t.roles.desc}
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.roles.cards.map((card, i) => {
            const meta = roleMeta[i];
            return (
              <div
                key={meta.id}
                className={`relative rounded-3xl border border-[var(--border)] p-7 bg-gradient-to-br ${meta.bg} hover:shadow-xl transition-shadow flex flex-col`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.accent}`}>
                  <meta.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 text-lg text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>{card.title}</h3>
                <p className="mt-2 text-sm text-[var(--teal-deep)]/70 leading-relaxed flex-1">{card.desc}</p>
                <button
                  onClick={() => onPick?.(meta.id)}
                  className="mt-5 inline-flex items-center gap-2 text-[var(--teal-deep)] group"
                >
                  <span style={{ fontWeight: 500 }}>{card.cta}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
