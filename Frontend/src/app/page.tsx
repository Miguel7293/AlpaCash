"use client";

import { useRouter } from "next/navigation";
import { PillNavbar, type NavTarget } from "@/components/shell/PillNavbar";
import { LivePriceTicker } from "@/components/LivePriceTicker";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { PublicMarketplace } from "@/components/PublicMarketplace";
import { MarketPrices } from "@/components/MarketPrices";
import { Trust } from "@/components/Trust";
import { Impact } from "@/components/Impact";
import { Roles } from "@/components/Roles";
import { Languages } from "@/components/Languages";
import { CTAFooter } from "@/components/CTAFooter";

export default function Home() {
  const router = useRouter();

  const onNav = (t: NavTarget) => {
    if (t === "landing") return window.scrollTo({ top: 0, behavior: "smooth" });
    if (t === "marketplace") return router.push("/marketplace");
    if (t === "login") return router.push("/auth/login");
    if (t === "register") return router.push("/auth/register");
    if (t === "demo") {
      document.getElementById("como")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (t === "prices") {
      document.getElementById("prices")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (t === "trust") {
      document.getElementById("trust")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ivory)] text-[var(--foreground)]">
      <PillNavbar current="landing" onNavigate={onNav} onLogin={() => router.push("/auth/login")} onRegister={() => router.push("/auth/register")} />
      <div className="h-20 sm:h-24" /> {/* Espaciador para evitar solapamiento de navbar con el ticker de trading */}
      <LivePriceTicker />
      <main>
        <Hero
          onPrimary={() => router.push("/auth/login?role=producer")}
          onSecondary={() => router.push("/auth/login?role=buyer")}
          onExplore={() => router.push("/marketplace")}
        />

        <PublicMarketplace onExplore={() => router.push("/marketplace")} />
        <Problem />
        <Solution />
        <div id="prices"><MarketPrices /></div>
        <div id="trust"><Trust /></div>
        <Impact />
        <Roles
          onPick={(roleId) =>
            router.push(roleId === "admin" ? "/auth/admin" : `/auth/login?role=${roleId}`)
          }
        />
        <Languages />
        <CTAFooter />
      </main>
    </div>
  );
}
