"use client";

import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MithronThumbImage } from "@/components/media/mithron-thumb-image";
import { catalogCategoryDefinitions } from "@/lib/catalog-categories";
import type { CatalogSearchResult } from "@/services/catalog";
import { useUiStore } from "@/store/ui";
import { formatUsd } from "@/lib/utils";

type SearchResponse = {
  query: string;
  results: CatalogSearchResult[];
  error?: string;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = globalThis.setTimeout(() => setDebounced(value), delayMs);
    return () => globalThis.clearTimeout(timerId);
  }, [value, delayMs]);

  return debounced;
}

export function SearchOverlay() {
  const overlay = useUiStore((state) => state.overlay);
  const setOverlay = useUiStore((state) => state.setOverlay);
  const [query, setQuery] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<CatalogSearchResult[]>([]);
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debouncedQuery = useDebouncedValue(query, 220);
  const hasQuery = query.trim().length > 0;
  const visibleProducts = hasQuery ? results : featuredProducts;
  const promoProduct = useMemo(
    () => featuredProducts.find((product) => Boolean(product.badge)) ?? featuredProducts[0],
    [featuredProducts]
  );
  const open = overlay === "search";

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const controller = new AbortController();

    void fetch("/api/catalog/search?limit=4", {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(async (response) => {
        const payload = await response.json() as SearchResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Search failed.");
        }
        if (!active) return;
        setFeaturedProducts(payload.results);
        if (!query.trim()) {
          setResults(payload.results);
        }
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setSearchError(error instanceof Error ? error.message : "Search failed.");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;

    const normalized = debouncedQuery.trim();
    if (!normalized) {
      setResults(featuredProducts);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    void fetch(`/api/catalog/search?q=${encodeURIComponent(normalized)}&limit=24`, {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(async (response) => {
        const payload = await response.json() as SearchResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Search failed.");
        }
        if (!active) return;
        setResults(payload.results);
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setSearchError(error instanceof Error ? error.message : "Search failed.");
        setResults([]);
      })
      .finally(() => {
        if (active) setIsSearching(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery, featuredProducts, open]);

  return (
    <div
      className={`search-overlay-root fixed inset-0 z-[1001] ${open ? "is-open" : ""}`}
      aria-hidden={!open}
      aria-label="Search catalog"
      aria-modal={open ? "true" : undefined}
      role="dialog"
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className="search-overlay-backdrop absolute inset-0 bg-black/88"
        aria-label="Dismiss search overlay"
        onClick={() => setOverlay(null)}
      />
      <div className="search-overlay-panel ambient-surface ambient-dark relative text-white shadow-[0_20px_60px_rgba(15,23,42,.24)]">
        <div className="mx-auto max-w-5xl px-6 py-9">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <Search className="size-7 text-white/70" />
            <input
              ref={inputRef}
              autoFocus={open}
              aria-label="Search Mithron systems"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Mithron systems"
              tabIndex={open ? 0 : -1}
              className="h-12 flex-1 bg-transparent font-display text-2xl font-medium outline-none placeholder:text-white/40"
            />
            <button tabIndex={open ? 0 : -1} aria-label="Close search" onClick={() => setOverlay(null)} type="button">
              <X className="size-7" />
            </button>
          </div>
          <div className="grid gap-8 py-7 md:grid-cols-[1.2fr_.72fr]">
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="type-button text-sm text-white/40">{hasQuery ? "Matching systems" : "Featured systems"}</p>
                <p className="type-meta text-white/40">
                  {isSearching ? "Searching..." : `${visibleProducts.length} results`}
                </p>
              </div>
              {visibleProducts.length ? (
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  {visibleProducts.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/product/${product.slug}`}
                      tabIndex={open ? 0 : -1}
                      onClick={() => setOverlay(null)}
                      className="search-result-card ambient-surface ambient-muted group grid min-h-28 grid-cols-[82px_1fr] items-center gap-4 rounded-2xl border border-[var(--surface-border)] p-3 outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span className="relative size-20 rounded-xl bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                        {open ? <MithronThumbImage src={product.image.src} alt={product.image.alt} responsive={product.image.responsive} fill className="object-contain p-2" sizes="80px" /> : null}
                      </span>
                      <span>
                        <span className="type-meta text-[10px] text-white/40">{product.category}</span>
                        <span className="type-card-title mt-1 block text-base leading-5">{product.name}</span>
                        <span className="type-price mt-2 flex items-center justify-between gap-3 text-xs font-medium text-white/50">
                          From {formatUsd(product.price)}
                          <ArrowRight className="size-4 text-white/90" />
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="ambient-surface ambient-muted rounded-2xl border border-[var(--surface-border)] p-6">
                  <p className="type-card-title text-xl">{searchError ? "Search unavailable" : "No exact mission match"}</p>
                  <p className="type-body mt-2 text-sm text-white/50">
                    {searchError ?? "Try agriculture, mapping, controller, safety sensor, or surveillance."}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="type-button mb-4 text-sm text-white/40">Explore more</p>
              <div className="flex flex-wrap gap-2 text-sm">
                {catalogCategoryDefinitions.map((category) => (
                  <Link
                    key={category.slug}
                    href={category.href}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOverlay(null)}
                    className="search-chip type-button rounded-full border border-[var(--surface-border)] bg-white/5 px-4 py-2"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
              {promoProduct ? (
                <Link
                  href={`/product/${promoProduct.slug}`}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOverlay(null)}
                  className="ambient-surface ambient-dark mt-7 block rounded-2xl p-5 text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <p className="type-meta text-white/38">Popular search</p>
                  <h2 className="type-card-title mt-2 text-2xl">{promoProduct.name}</h2>
                  <p className="type-body mt-3 text-sm text-white/56">{promoProduct.tagline}</p>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
