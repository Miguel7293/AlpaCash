"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, ShoppingCart, CheckCircle2 } from "lucide-react";
import { ArtCard, SectionLabel } from "../../DashShell";
import { FiberBall, StampSeal } from "../../../icons/AlpaIcons";
import { useCart } from "@/lib/hooks/useCart";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import type { DisplayLot } from "@/components/modals/LotDetailModal";
import { useMarketplaceLots } from "@/lib/hooks/useDashboardData";
type Lot = DisplayLot & { color: string; grade: string; certified: boolean };

type SortKey = "precio-asc" | "precio-desc" | "recientes" | "grado";

export function MarketplaceTab({ onOpenLot }: { onOpenLot?: (lot: DisplayLot) => void }) {
  const { addItem, items } = useCart();
  const { role } = useAuth();
  const { lots: allLots, loading } = useMarketplaceLots();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todos");
  const [originFilter, setOriginFilter] = useState("Todos");
  const [gradeFilter, setGradeFilter] = useState("Todos");
  const [sort, setSort] = useState<SortKey>("recientes");
  const [showFilters, setShowFilters] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set(items.map((i) => i.id)));

  const cats = ["Todos", "Baby", "Súper Baby", "Fleece", "Médium", "Gruesa"];
  const origins = ["Todos", "Puno", "Cusco", "Arequipa", "Apurímac"];
  const grades = ["Todos", "A+", "A", "B"];

  const filtered = useMemo(() => {
    let list = allLots;
    if (search) list = list.filter((l) => l.id.toLowerCase().includes(search.toLowerCase()) || l.prod.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== "Todos") list = list.filter((l) => l.cat === catFilter);
    if (originFilter !== "Todos") list = list.filter((l) => l.origin === originFilter);
    if (gradeFilter !== "Todos") list = list.filter((l) => l.grade === gradeFilter);
    if (sort === "precio-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "grado") list = [...list].sort((a, b) => (a.grade === "A+" ? 0 : a.grade === "A" ? 1 : 2) - (b.grade === "A+" ? 0 : b.grade === "A" ? 1 : 2));
    return list;
  }, [allLots, search, catFilter, originFilter, gradeFilter, sort]);

  const handleAdd = (l: Lot) => {
    // Block admin role before cart add — spec 4.1
    if (role === "admin") {
      toast.error("Los administradores no pueden realizar compras.", {
        description: "Esta función es exclusiva para compradores registrados.",
      });
      return;
    }
    addItem({
      id: l.id,
      cat: l.cat,
      origin: l.origin,
      lb: l.lb,
      price: l.price,
      prod: l.prod,
      grade: l.grade,
      // Propagate DB identifiers so CartDrawer can validate checkout FKs
      recordId: l.recordId,
      productorId: l.productorId,
    });
    setAdded((prev) => new Set([...prev, l.id]));
  };

  return (
    <div>
      {/* Search + filters bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--paper)] border-2 border-[var(--ink)]/15">
          <Search className="w-4 h-4 text-[var(--ink)]/40 flex-shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ID o productor…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2.5 rounded-full border-2 flex items-center gap-2 text-sm transition-colors ${showFilters ? "bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]" : "border-[var(--ink)]/20"}`}>
          <SlidersHorizontal className="w-4 h-4" /> Filtros
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="px-4 py-2.5 rounded-full border-2 border-[var(--ink)]/20 bg-[var(--paper)] text-sm outline-none">
          <option value="recientes">Más recientes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="grado">Mejor grado</option>
        </select>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-4 rounded-2xl bg-[var(--paper)] border-2 border-[var(--ink)]/10">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Categoría", opts: cats, val: catFilter, set: setCatFilter },
              { label: "Origen", opts: origins, val: originFilter, set: setOriginFilter },
              { label: "Grado", opts: grades, val: gradeFilter, set: setGradeFilter },
            ].map(({ label, opts, val, set }) => (
              <div key={label}>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink)]/50 mb-2">{label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {opts.map((o) => (
                    <button key={o} onClick={() => set(o)} className={`px-2.5 py-1 rounded-full border text-xs transition-all ${val === o ? "bg-[var(--ink)] text-[var(--ivory)] border-[var(--ink)]" : "border-[var(--ink)]/20"}`}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--ivory)] px-4 py-3 text-sm text-[var(--teal-deep)]">
          Sincronizando lotes en tiempo real...
        </div>
      )}

      <SectionLabel n="N°01">{filtered.length} lotes disponibles</SectionLabel>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <ArtCard className="p-4 h-full flex flex-col">
              <div className="flex items-start justify-between">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink)]/50">Pasaporte</div>
                <div className="flex items-center gap-1">
                  {l.certified && <StampSeal size={14} className="text-[var(--gold)]" />}
                  <span className="px-2 py-0.5 rounded-full bg-[var(--gold)] text-[var(--ink)] text-[10px] font-mono" style={{ fontWeight: 700 }}>{l.grade}</span>
                </div>
              </div>
              <div className="font-display text-xl mt-1" style={{ fontWeight: 700 }}>{l.id}</div>
              <div className="mt-2 aspect-square rounded-xl border-2 border-[var(--ink)]/15 bg-[var(--ivory)] flex items-center justify-center">
                <FiberBall size={56} className="text-[var(--terracotta)] floaty" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-[var(--ink)]/60">{l.cat}</span>
                <span className="text-right font-mono">{l.lb} lb</span>
                <span className="text-[var(--ink)]/60">{l.origin}</span>
                <span className="text-right text-[var(--terracotta)]" style={{ fontWeight: 600 }}>S/ {l.price}/lb</span>
              </div>
              <div className="mt-2 text-[10px] text-[var(--ink)]/50 truncate">{l.prod}</div>
              <div className="mt-3 pt-3 border-t-2 border-dashed border-[var(--ink)]/15 flex gap-2">
                <button onClick={() => onOpenLot?.(l)} className="flex-1 py-2 rounded-full border-2 border-[var(--ink)]/20 text-xs hover:bg-[var(--paper)] transition-colors">Ver detalle</button>
                <button
                  onClick={() => handleAdd(l)}
                  disabled={added.has(l.id)}
                  className={`flex-1 py-2 rounded-full text-xs flex items-center justify-center gap-1 transition-colors ${added.has(l.id) ? "bg-[var(--mint)] border-2 border-[var(--ink)]/20 text-[var(--ink)]" : "bg-[var(--ink)] text-[var(--ivory)] hover:bg-[var(--teal-500)]"}`}
                  style={{ fontWeight: 500 }}
                >
                  {added.has(l.id) ? <><CheckCircle2 className="w-3 h-3" /> Añadido</> : <><ShoppingCart className="w-3 h-3" /> Añadir</>}
                </button>
              </div>
            </ArtCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
