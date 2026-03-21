"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  description: string;
  category: {
    id: number;
    name: string;
    slug: string;
    image: string;
  };
  images: string[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/400x400?text=No+Image";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  if (!cleaned.startsWith("http"))
    return "https://placehold.co/400x400?text=No+Image";
  return cleaned;
}

/* ─────────────────────────────────────────────
   In production, this would call your NestJS
   backend which queries Elasticsearch.
   
   For now, we use the Platzi API with client-
   side title filtering to demonstrate the UX.
   
   Production endpoint would be:
   GET /api/search?q=shoes&category=1&minPrice=10&maxPrice=100&page=1
───────────────────────────────────────────── */

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest First" },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const initialCategory = searchParams.get("category");

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    initialCategory ? Number(initialCategory) : null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync URL params → state when navigating between categories
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    const urlCategory = searchParams.get("category");

    setQuery(urlQuery);
    setSelectedCategory(urlCategory ? Number(urlCategory) : null);
  }, [searchParams]);

  // Fetch categories for filter sidebar
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(
          "https://api.escuelajs.co/api/v1/categories?limit=10"
        );
        if (res.ok) setCategories(await res.json());
      } catch {
        /* silent */
      }
    }
    fetchCategories();
  }, []);

  // Search function
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      /*
       * ── PRODUCTION: Call your NestJS Elasticsearch endpoint ──
       *
       * const params = new URLSearchParams({
       *   q: query,
       *   ...(selectedCategory && { categoryId: String(selectedCategory) }),
       *   minPrice: String(priceRange[0]),
       *   maxPrice: String(priceRange[1]),
       *   sortBy,
       *   page: '1',
       *   limit: '20',
       * });
       * const res = await fetch(`${API_BASE}/api/search?${params}`);
       * const { products, total, aggregations } = await res.json();
       *
       * ── DEMO: Using Platzi API with client-side filtering ──
       */

      let url = `https://api.escuelajs.co/api/v1/products?offset=0&limit=50`;
      if (selectedCategory) {
        url += `&categoryId=${selectedCategory}`;
      }
      if (query) {
        url += `&title=${encodeURIComponent(query)}`;
      }
      if (priceRange[0] > 0) {
        url += `&price_min=${priceRange[0]}`;
      }
      if (priceRange[1] < 10000) {
        url += `&price_max=${priceRange[1]}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      let data: Product[] = await res.json();

      // Client-side sort (Elasticsearch would handle this server-side)
      if (sortBy === "price_asc") data.sort((a, b) => a.price - b.price);
      if (sortBy === "price_desc") data.sort((a, b) => b.price - a.price);
      if (sortBy === "newest") data.sort((a, b) => b.id - a.id);

      setProducts(data);
      setTotalResults(data.length);
    } catch {
      setProducts([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, priceRange, sortBy]);

  // Trigger search on mount and when filters change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Handle search submit
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Update URL
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
    performSearch();
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-8">
      {/* ── Search header ── */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories, brands..."
              className="input-amcart pr-10 text-base"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] text-lg">
              🔍
            </span>
          </div>
          <button type="submit" className="btn-primary px-8 py-3">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline-gold px-5 py-3 md:hidden"
          >
            Filters {showFilters ? "▲" : "▼"}
          </button>
        </form>

        {/* Results count + sort */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-[var(--text-light)] text-sm">
            {loading ? (
              "Searching..."
            ) : (
              <>
                <span className="text-[var(--dark)] font-semibold">
                  {totalResults}
                </span>{" "}
                results
                {initialQuery && (
                  <>
                    {" "}
                    for{" "}
                    <span className="text-[var(--dark)] font-semibold">
                      &quot;{initialQuery}&quot;
                    </span>
                  </>
                )}
              </>
            )}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-amcart w-auto text-sm py-2 px-3"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Main content: sidebar + grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* ── Sidebar filters ── */}
        <aside
          className={`${
            showFilters ? "block" : "hidden"
          } md:block`}
        >
          <div className="panel-amcart">
            <div className="panel-head">
              <h3 className="text-sm font-semibold text-[var(--dark)]">
                Filters
              </h3>
            </div>
            <div className="panel-body space-y-6">
              {/* Category filter */}
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-light)] mb-3">
                  Category
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                      selectedCategory === null
                        ? "bg-[var(--bg-light)] text-[var(--dark)] font-semibold border-l-[3px] border-l-[var(--gold)]"
                        : "text-[var(--text)] hover:bg-[var(--bg-light)]"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === cat.id ? null : cat.id
                        )
                      }
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-[var(--bg-light)] text-[var(--dark)] font-semibold border-l-[3px] border-l-[var(--gold)]"
                          : "text-[var(--text)] hover:bg-[var(--bg-light)]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-light)] mb-3">
                  Price Range
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    className="input-amcart text-sm py-2 px-2 w-full"
                    placeholder="Min"
                  />
                  <span className="text-[var(--text-light)] text-sm">—</span>
                  <input
                    type="number"
                    min={0}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="input-amcart text-sm py-2 px-2 w-full"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Clear all */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setPriceRange([0, 10000]);
                  setSortBy("relevance");
                  setQuery("");
                }}
                className="text-[var(--error)] text-[12px] font-semibold uppercase tracking-wider hover:underline"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* ── Elasticsearch info note ── */}
          <div className="mt-4 p-4 border border-dashed border-[var(--border)] bg-[var(--bg-light)]">
            <p className="text-[11px] text-[var(--text-light)] leading-relaxed">
              <strong className="text-[var(--dark)]">Note:</strong> In
              production, search is powered by Elasticsearch via the NestJS
              SearchModule — supporting fuzzy matching, faceted filters, and
              relevance scoring.
            </p>
          </div>
        </aside>

        {/* ── Product grid ── */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="panel-amcart animate-pulse">
                  <div className="bg-gray-100 h-52" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-100 w-3/4" />
                    <div className="h-3 bg-gray-100 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-light text-[var(--dark)] mb-2">
                No products found
              </h3>
              <p className="text-[var(--text-light)] text-sm mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setSelectedCategory(null);
                  setPriceRange([0, 10000]);
                }}
                className="btn-primary px-6 py-2.5"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="panel-amcart block group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="bg-[var(--bg-light)] h-52 relative overflow-hidden">
                    <img
                      src={cleanImageUrl(product.images?.[0])}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/400x400?text=No+Image";
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-[var(--dark)] text-[var(--gold)] text-[10px] font-bold tracking-[1.5px] uppercase px-2.5 py-1">
                      {product.category?.name}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[var(--text)] text-sm font-semibold mb-1 line-clamp-1">
                      {product.title}
                    </div>
                    <div className="text-[var(--text-light)] text-[11px] mb-2 line-clamp-1">
                      {product.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--dark)] text-sm font-semibold">
                        ${product.price}
                      </span>
                      <span className="text-[var(--gold-dark)] text-[11px] font-semibold group-hover:underline">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-8">
        <div className="text-center py-20">
          <div className="text-[var(--text-light)]">Loading search...</div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}