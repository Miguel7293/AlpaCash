"use client";

import { useMemo, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Search, SlidersHorizontal, Grid3x3, List, MapPin, BadgeCheck, ShieldCheck, Lock,
  ArrowUpDown, ChevronDown, Heart, Scale, ShoppingCart, ArrowLeft, X, CheckCircle2
} from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { CartDrawer } from "./modals/CartDrawer";
import { LotDetailModal, type DisplayLot } from "./modals/LotDetailModal";
import { useMarketplaceLots, type MarketplaceLotRecord } from "@/lib/hooks/useDashboardData";
import { useAuth } from "@/lib/hooks/useAuth";
import { AccountMenu } from "@/components/shell/AccountMenu";
import { AuthRequireModal } from "./modals/AuthRequireModal";
import { toast } from "sonner";

type Lot = {
  code: string;
  image: string;
  category: "Súper Baby" | "Baby" | "Fleece" | "Medium Fleece" | "Huarizo" | "Gruesa";
  quality: "Validada" | "En revisión" | "Certificable" | "Certificada";
  color: string;
  qty: number; // lb
  region: string;
  price: number;
  marketPrice: number;
  status: "Disponible" | "Reservado" | "En validación";
  rating: number;
  verifiedProducer: boolean;
};

type Filters = {
  categories: Set<string>;
  colors: Set<string>;
  regions: Set<string>;
  qualities: Set<string>;
  onlyVerified: boolean;
  available: boolean;
  minPrice: number;
  maxPrice: number;
};


const CATEGORIES: Lot["category"][] = ["Súper Baby", "Baby", "Fleece", "Medium Fleece", "Huarizo", "Gruesa"];
const COLORS = ["Blanco", "Beige", "Marrón claro", "Marrón", "Negro", "Mixto"];
const REGIONS = ["Puno", "Cusco", "Arequipa", "Apurímac"];
const QUALITIES: Lot["quality"][] = ["Validada", "Certificada", "Certificable", "En revisión"];

const qualityStyles: Record<Lot["quality"], string> = {
  Validada: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Certificada: "bg-sky-50 text-sky-700 border-sky-100",
  Certificable: "bg-indigo-50 text-indigo-700 border-indigo-100",
  "En revisión": "bg-amber-50 text-amber-700 border-amber-100",
};

const statusDot: Record<Lot["status"], string> = {
  Disponible: "bg-emerald-500",
  Reservado: "bg-amber-500",
  "En validación": "bg-sky-500",
};

export type LotExt = Lot & { recordId?: string; productorId?: string };

export type SortKey = "recommended" | "price-asc" | "price-desc" | "rating";

export function Marketplace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [filters, setFilters] = useState({
    categories: new Set<string>(),
    colors: new Set<string>(),
    regions: new Set<string>(),
    qualities: new Set<string>(),
    onlyVerified: false,
    available: false,
    minPrice: 0,
    maxPrice: 50,
  });
  const [compare, setCompare] = useState<Set<string>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [detailLot, setDetailLot] = useState<DisplayLot | null>(null);
  const [lotOpen, setLotOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const { items: cartItems, addItem, count } = useCart();
  const { lots: dbLots, loading } = useMarketplaceLots();
  const { user, nombre, role, signOut } = useAuth();

  const activeLots = useMemo<LotExt[]>(() => {
    if (dbLots && dbLots.length > 0) {
      return dbLots.map((dbLot: MarketplaceLotRecord) => ({
        recordId: dbLot.recordId,
        productorId: dbLot.productorId,
        code: dbLot.id,
        image: dbLot.color.toLowerCase().includes("blan")
          ? "https://images.unsplash.com/photo-1574883140236-2e2cb0835792?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900"
          : "https://images.unsplash.com/photo-1598871956222-26b66d6559fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
        category: (dbLot.cat || "Fibra") as LotExt["category"],
        quality: (dbLot.grade === "A+" || dbLot.grade === "A" ? "Certificada" : dbLot.grade === "B" ? "Validada" : "En revisión") as LotExt["quality"],
        color: dbLot.color,
        qty: dbLot.lb,
        region: dbLot.origin,
        price: dbLot.price,
        marketPrice: dbLot.price * 0.95,
        status: dbLot.certified ? "Disponible" : "En validación",
        rating: 4.8,
        verifiedProducer: true,
      }));
    }
    return [];
  }, [dbLots]);

  const isInCart = (code: string) => cartItems.some((c) => c.id === code);
  const handleAdd = (l: LotExt) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    // Block admin role before reaching the cart — spec 4.1
    if (role === "admin") {
      toast.error("Los administradores no pueden realizar compras en el marketplace.", {
        description: "Esta función es exclusiva para compradores registrados.",
      });
      return;
    }
    if (isInCart(l.code)) return;
    addItem({
      id: l.code,
      cat: l.category,
      origin: l.region,
      lb: l.qty,
      price: l.price,
      prod: l.verifiedProducer ? "Productor verificado" : "Productor (pendiente)",
      grade: l.quality,
      recordId: l.recordId,
      productorId: l.productorId,
    });
  };

  const filtered = useMemo(() => {
    let list = activeLots.filter((l) => {
      if (q && !`${l.code} ${l.region} ${l.color} ${l.category}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (filters.categories.size && !filters.categories.has(l.category)) return false;
      if (filters.colors.size && !filters.colors.has(l.color)) return false;
      if (filters.regions.size && !filters.regions.has(l.region)) return false;
      if (filters.qualities.size && !filters.qualities.has(l.quality)) return false;
      if (filters.onlyVerified && !l.verifiedProducer) return false;
      if (filters.available && l.status !== "Disponible") return false;
      if (l.price < filters.minPrice || l.price > filters.maxPrice) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [activeLots, q, sort, filters]);

  const comparedLots = useMemo(
    () => activeLots.filter((lot) => compare.has(lot.code)),
    [activeLots, compare]
  );

  const toggleSet = (key: "categories" | "colors" | "regions" | "qualities", value: string) => {
    setFilters((f) => {
      const s = new Set(f[key]);
      if (s.has(value)) {
        s.delete(value);
      } else {
        s.add(value);
      }
      return { ...f, [key]: s };
    });
  };

  const toggleCompare = (code: string) => {
    setCompare((c) => {
      const n = new Set(c);
      if (n.has(code)) n.delete(code);
      else if (n.size < 3) n.add(code);
      return n;
    });
  };

  const openLotDetail = (lot: Lot) => {
    setDetailLot({
      id: lot.code,
      cat: lot.category,
      color: lot.color,
      origin: lot.region,
      lb: lot.qty,
      price: lot.price,
      prod: lot.verifiedProducer ? "Productor verificado" : "Productor (pendiente)",
      grade: lot.quality,
    });
    setLotOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--ivory)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[var(--ivory)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 flex items-center gap-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-[var(--teal-deep)]/80 hover:text-[var(--teal-deep)]">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="w-px h-6 bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <img src="/ALPACASH.svg" alt="AlpaCash Logo" className="h-8 w-auto" />
            <span className="text-[var(--teal-deep)] hidden sm:inline" style={{ fontWeight: 600 }}>AlpaCash · Marketplace</span>
          </div>
          <div className="flex-1 max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código, región, color, categoría…"
              className="pl-9 h-10 bg-white border-[var(--border)] rounded-full"
            />
          </div>
          <div className="flex items-center gap-2">
            {user && nombre ? (
              <AccountMenu
                nombre={nombre}
                role={role}
                avatarUrl={user.user_metadata?.avatar_url ?? null}
                onSignOut={signOut}
                variant="header"
              />
            ) : (
              <Button
                variant="outline"
                onClick={() => window.location.href = "/auth/login"}
                className="rounded-full border-[var(--teal-deep)]/30 text-[var(--teal-deep)] hover:bg-[var(--teal-deep)]/5"
              >
                Ingresar
              </Button>
            )}
            <Button variant="ghost" className="text-[var(--teal-deep)] hover:bg-[var(--ivory-2)] rounded-full px-3">
              <Heart className="w-4 h-4 mr-1.5" /> 4
            </Button>
            <Button onClick={() => { if (!user) { setAuthModalOpen(true); } else { setCartOpen(true); } }} className="bg-[var(--teal-deep)] hover:bg-[var(--teal-700)] text-[var(--ivory)] rounded-full">
              <ShoppingCart className="w-4 h-4 mr-1.5" /> Carrito ({count})
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar filters */}
        <aside className="hidden lg:block col-span-3 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[var(--teal-deep)] flex items-center gap-2" style={{ fontWeight: 600 }}>
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </h3>
              <button className="text-xs text-[var(--terracotta)] hover:underline" onClick={() => setFilters({ categories: new Set(), colors: new Set(), regions: new Set(), qualities: new Set(), onlyVerified: false, available: false, minPrice: 0, maxPrice: 50 })}>
                Limpiar
              </button>
            </div>

            <FilterGroup title="Categoría" items={CATEGORIES} selected={filters.categories} onToggle={(v) => toggleSet("categories", v)} />
            <FilterGroup title="Calidad / Validación" items={QUALITIES} selected={filters.qualities} onToggle={(v) => toggleSet("qualities", v)} />
            <FilterGroup title="Color" items={COLORS} selected={filters.colors} onToggle={(v) => toggleSet("colors", v)} />
            <FilterGroup title="Región" items={REGIONS} selected={filters.regions} onToggle={(v) => toggleSet("regions", v)} />

            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-2">Precio S/ / lb</div>
              <div className="flex items-center gap-2">
                <Input type="number" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: +e.target.value })} className="h-9 bg-white" />
                <span className="text-[var(--muted-foreground)]">—</span>
                <Input type="number" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: +e.target.value })} className="h-9 bg-white" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <label className="flex items-center gap-2 text-sm text-[var(--teal-deep)]">
                <input type="checkbox" checked={filters.onlyVerified} onChange={(e) => setFilters({ ...filters, onlyVerified: e.target.checked })} />
                Solo productor verificado
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--teal-deep)]">
                <input type="checkbox" checked={filters.available} onChange={(e) => setFilters({ ...filters, available: e.target.checked })} />
                Solo disponibles
              </label>
            </div>

            <div className="rounded-xl bg-[var(--ivory-2)] p-3 text-xs text-[var(--teal-deep)]/80 flex gap-2">
              <Lock className="w-4 h-4 mt-0.5 text-[var(--terracotta)] shrink-0" />
              Datos del productor protegidos. Solicita acceso formal para ver contacto y ubicación exacta.
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div>
              <h1 className="text-2xl tracking-tight text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>Lotes trazables disponibles</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{filtered.length} lotes · información parcial · vista comprador</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="appearance-none h-10 pl-9 pr-9 rounded-full bg-white border border-[var(--border)] text-sm text-[var(--teal-deep)]"
                >
                  <option value="recommended">Recomendados</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="rating">Mejor reputación</option>
                </select>
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              </div>
              <div className="flex items-center bg-white rounded-full border border-[var(--border)] p-1">
                <button onClick={() => setView("grid")} className={`p-2 rounded-full ${view === "grid" ? "bg-[var(--teal-deep)] text-[var(--ivory)]" : "text-[var(--teal-deep)]"}`}><Grid3x3 className="w-4 h-4" /></button>
                <button onClick={() => setView("list")} className={`p-2 rounded-full ${view === "list" ? "bg-[var(--teal-deep)] text-[var(--ivory)]" : "text-[var(--teal-deep)]"}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Active chips */}
          <ActiveChips filters={filters} toggleSet={toggleSet} />

          {loading && (
            <div className="mb-5 p-4 rounded-2xl bg-[var(--gold)]/20 border-2 border-[var(--ink)] flex items-center justify-center gap-3 text-sm text-[var(--ink)]">
              <span className="w-2 h-2 rounded-full bg-[var(--terracotta)] animate-ping" />
              Sincronizando lotes en tiempo real...
            </div>
          )}

          {/* Grid / List */}
          {view === "grid" ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((l) => (
                <LotCard
                  key={l.code}
                  l={l}
                  compare={compare.has(l.code)}
                  onCompare={() => toggleCompare(l.code)}
                  onView={() => openLotDetail(l)}
                  inCart={isInCart(l.code)}
                  onAdd={() => handleAdd(l)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((l) => (
                <LotRow
                  key={l.code}
                  l={l}
                  compare={compare.has(l.code)}
                  onCompare={() => toggleCompare(l.code)}
                  onView={() => openLotDetail(l)}
                  inCart={isInCart(l.code)}
                  onAdd={() => handleAdd(l)}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center">
              <div className="text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>Sin resultados</div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Ajusta los filtros o limpia tu búsqueda.</p>
            </div>
          )}
        </main>
      </div>

      {/* Compare drawer */}
      {compare.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[var(--teal-deep)] text-[var(--ivory)] rounded-full shadow-2xl border border-white/10 pl-4 pr-2 py-2 flex items-center gap-3 max-w-[92vw]">
          <Scale className="w-4 h-4 text-[var(--gold-soft)]" />
          <span className="text-sm">Comparar {compare.size} / 3 lotes</span>
          <div className="flex items-center gap-1">
            {Array.from(compare).map((c) => (
              <span key={c} className="text-[10px] bg-white/10 rounded-full px-2 py-0.5 flex items-center gap-1">
                {c} <button onClick={() => toggleCompare(c)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <Button size="sm" onClick={() => setCompareOpen(true)} className="bg-[var(--gold)] text-[var(--teal-deep)] hover:bg-[var(--gold-soft)] rounded-full">
            Comparar ahora
          </Button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthRequireModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <LotDetailModal open={lotOpen} lot={detailLot} onClose={() => setLotOpen(false)} />

      {compareOpen && comparedLots.length > 0 && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[var(--ink)]/60 backdrop-blur-sm" onClick={() => setCompareOpen(false)} />
          <div className="absolute inset-x-4 top-8 bottom-8 overflow-auto rounded-3xl bg-white border border-[var(--border)] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Comparador</div>
                <h2 className="text-2xl text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>
                  {comparedLots.length} lotes seleccionados
                </h2>
              </div>
              <button onClick={() => setCompareOpen(false)} className="w-10 h-10 rounded-full bg-[var(--teal-deep)] text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {comparedLots.map((lot: LotExt) => (
                <article key={lot.code} className="rounded-2xl border border-[var(--border)] p-5 bg-[var(--ivory)]">
                  <div className="flex items-center justify-between">
                    <div className="text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>{lot.code}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${qualityStyles[lot.quality]}`}>{lot.quality}</span>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Categoría</dt><dd>{lot.category}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Color</dt><dd>{lot.color}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Origen</dt><dd>{lot.region}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Cantidad</dt><dd>{lot.qty} lb</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Precio</dt><dd>S/ {lot.price.toFixed(2)}/lb</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-[var(--muted-foreground)]">Reputación</dt><dd>★ {lot.rating.toFixed(1)}</dd></div>
                  </dl>
                  <div className="mt-5 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => openLotDetail(lot)}>
                      Ver ficha
                    </Button>
                    <Button className="flex-1 bg-[var(--terracotta)] hover:bg-[var(--terracotta-soft)]" onClick={() => handleAdd(lot)} disabled={isInCart(lot.code)}>
                      {isInCart(lot.code) ? "Añadido" : "Solicitar"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, items, selected, onToggle }: { title: string; items: readonly string[]; selected: Set<string>; onToggle: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--muted-foreground)] mb-2">{title}</div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <label key={it} className="flex items-center justify-between text-sm text-[var(--teal-deep)] cursor-pointer hover:bg-[var(--ivory)] px-1.5 py-1 rounded-md">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={selected.has(it)} onChange={() => onToggle(it)} />
              {it}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ActiveChips({ filters, toggleSet }: { filters: Filters; toggleSet: (key: "categories" | "colors" | "regions" | "qualities", value: string) => void }) {
  const chips: { group: "categories" | "colors" | "regions" | "qualities"; v: string }[] = [];
  (["categories", "colors", "regions", "qualities"] as const).forEach((g) => {
    (filters[g] as Set<string>).forEach((v) => chips.push({ group: g, v }));
  });
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((c) => (
        <button
          key={`${c.group}-${c.v}`}
          onClick={() => toggleSet(c.group, c.v)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[var(--teal-deep)] text-[var(--ivory)]"
        >
          {c.v} <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}

function PriceDelta({ price, market }: { price: number; market: number }) {
  const diff = ((price - market) / market) * 100;
  const cls = diff > 1 ? "text-emerald-600" : diff < -1 ? "text-[var(--terracotta)]" : "text-[var(--muted-foreground)]";
  const label = diff > 1 ? `+${diff.toFixed(1)}% s/ mercado` : diff < -1 ? `${diff.toFixed(1)}% s/ mercado` : "Dentro del rango";
  return <span className={`text-[10px] ${cls}`}>{label}</span>;
}

function LotCard({ l, compare, onCompare, onView, inCart, onAdd }: { l: Lot; compare: boolean; onCompare: () => void; onView: () => void; inCart: boolean; onAdd: () => void }) {
  return (
    <article className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all group">
      <div className="relative aspect-[4/3] bg-[var(--ivory-2)] overflow-hidden">
        <ImageWithFallback src={l.image} alt={`Lote ${l.code}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-xs text-[var(--teal-deep)]" style={{ fontWeight: 500 }}>{l.category}</div>
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-[var(--teal-deep)] hover:text-[var(--terracotta)]">
          <Heart className="w-4 h-4" />
        </button>
        {l.verifiedProducer && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[var(--teal-deep)]/90 text-[var(--ivory)] backdrop-blur">
            <ShieldCheck className="w-3 h-3 text-[var(--gold-soft)]" /> Productor verificado
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>Lote {l.code}</div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${qualityStyles[l.quality]}`}>{l.quality}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
          <dt className="text-[var(--muted-foreground)]">Color</dt><dd className="text-right text-[var(--teal-deep)]">{l.color}</dd>
          <dt className="text-[var(--muted-foreground)]">Cantidad</dt><dd className="text-right text-[var(--teal-deep)]">{l.qty} lb</dd>
          <dt className="text-[var(--muted-foreground)]">Origen</dt><dd className="text-right text-[var(--teal-deep)] flex items-center justify-end gap-1"><MapPin className="w-3 h-3 text-[var(--terracotta)]" />{l.region}</dd>
          <dt className="text-[var(--muted-foreground)]">Reputación</dt><dd className="text-right text-[var(--teal-deep)]">★ {l.rating.toFixed(1)}</dd>
        </dl>
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Precio solicitado</div>
            <div className="text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>S/ {l.price.toFixed(2)} <span className="text-xs text-[var(--muted-foreground)]" style={{ fontWeight: 400 }}>/ lb</span></div>
            <PriceDelta price={l.price} market={l.marketPrice} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--teal-deep)]/80">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[l.status]}`} /> {l.status}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button onClick={onCompare} className={`text-xs py-2 rounded-full border flex items-center justify-center gap-1 transition-colors ${compare ? "bg-[var(--teal-deep)] text-[var(--ivory)] border-[var(--teal-deep)]" : "border-[var(--border)] text-[var(--teal-deep)] hover:bg-[var(--ivory-2)]"}`}>
            <Scale className="w-3.5 h-3.5" /> Comparar
          </button>
          <button onClick={onView} className="text-xs py-2 rounded-full border border-[var(--border)] text-[var(--teal-deep)] hover:bg-[var(--ivory-2)] flex items-center justify-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" /> Ver ficha
          </button>
          <button
            onClick={onAdd}
            disabled={inCart}
            className="text-xs py-2 rounded-full bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta-soft)] flex items-center justify-center gap-1 disabled:bg-emerald-600 disabled:opacity-90"
          >
            {inCart ? <><CheckCircle2 className="w-3.5 h-3.5" /> Añadido</> : <><ShoppingCart className="w-3.5 h-3.5" /> Solicitar</>}
          </button>
        </div>
      </div>
    </article>
  );
}

function LotRow({ l, compare, onCompare, onView, inCart, onAdd }: { l: Lot; compare: boolean; onCompare: () => void; onView: () => void; inCart: boolean; onAdd: () => void }) {
  return (
    <article className="bg-white rounded-2xl border border-[var(--border)] p-4 flex gap-4 hover:shadow-md transition-shadow">
      <div className="relative w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-[var(--ivory-2)]">
        <ImageWithFallback src={l.image} alt={l.code} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12 md:col-span-5">
          <div className="flex items-center gap-2">
            <span className="text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>Lote {l.code}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ivory-2)] text-[var(--teal-deep)]">{l.category}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${qualityStyles[l.quality]}`}>{l.quality}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--muted-foreground)] flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[var(--terracotta)]" /> {l.region}</span>
            <span>{l.color}</span>
            <span>{l.qty} lb</span>
            <span>★ {l.rating.toFixed(1)}</span>
            {l.verifiedProducer && <span className="text-emerald-700 inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verificado</span>}
          </div>
        </div>
        <div className="col-span-6 md:col-span-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Precio</div>
          <div className="text-[var(--teal-deep)]" style={{ fontWeight: 600 }}>S/ {l.price.toFixed(2)} <span className="text-xs text-[var(--muted-foreground)]" style={{ fontWeight: 400 }}>/lb</span></div>
          <PriceDelta price={l.price} market={l.marketPrice} />
        </div>
        <div className="col-span-6 md:col-span-2 text-xs text-[var(--teal-deep)]/80 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[l.status]}`} /> {l.status}
        </div>
        <div className="col-span-12 md:col-span-2 flex md:flex-col gap-2">
          <button onClick={onCompare} className={`flex-1 text-xs py-2 rounded-full border ${compare ? "bg-[var(--teal-deep)] text-[var(--ivory)] border-[var(--teal-deep)]" : "border-[var(--border)] text-[var(--teal-deep)]"}`}>Comparar</button>
          <button onClick={onView} className="flex-1 text-xs py-2 rounded-full border border-[var(--border)] text-[var(--teal-deep)]">Ver ficha</button>
          <button
            onClick={onAdd}
            disabled={inCart}
            className="flex-1 text-xs py-2 rounded-full bg-[var(--terracotta)] text-white disabled:bg-emerald-600 disabled:opacity-90"
          >
            {inCart ? "Añadido" : "Solicitar"}
          </button>
        </div>
      </div>
    </article>
  );
}
