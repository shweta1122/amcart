"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface SearchSuggestion {
  id: number;
  title: string;
  price: number;
  category: { name: string };
  images: string[];
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/40x40?text=·";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  if (!cleaned.startsWith("http")) return "https://placehold.co/40x40?text=·";
  return cleaned;
}

/* ─────────────────────────────────────────────
   SearchBar — drop into your header/nav

   Usage:
   <SearchBar />
   
   Production: replace the Platzi API calls
   with your NestJS Elasticsearch endpoint:
   GET /api/search/suggest?q=...
───────────────────────────────────────────── */
export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        /*
         * ── PRODUCTION: ──
         * const res = await fetch(
         *   `${API_BASE}/api/search/suggest?q=${encodeURIComponent(query)}&limit=5`
         * );
         *
         * ── DEMO: Platzi API ──
         */
        const res = await fetch(
          `https://api.escuelajs.co/api/v1/products?title=${encodeURIComponent(
            query
          )}&offset=0&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowDropdown(data.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search products..."
          className="w-full bg-white/10 border border-white/15 text-white text-sm
                     px-4 py-2 placeholder:text-white/40
                     focus:border-[var(--gold)] focus:bg-white/15
                     outline-none transition-colors"
        />
        <button
          type="submit"
          className="bg-[var(--gold)] text-[var(--dark)] px-4 py-2
                     text-sm font-semibold hover:bg-[var(--gold-dark)] transition-colors"
        >
          🔍
        </button>
      </form>

      {/* ── Suggestions dropdown ── */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--border)]
                     shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-sm text-[var(--text-light)]">
              Searching...
            </div>
          ) : (
            <>
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  onClick={() => {
                    setShowDropdown(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-light)]
                             transition-colors border-b border-[var(--border)] last:border-b-0"
                >
                  <img
                    src={cleanImageUrl(item.images?.[0])}
                    alt=""
                    className="w-10 h-10 object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/40x40?text=·";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--dark)] font-medium truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-light)]">
                      {item.category?.name} · ${item.price}
                    </div>
                  </div>
                </Link>
              ))}

              {/* View all results link */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push(
                    `/search?q=${encodeURIComponent(query.trim())}`
                  );
                }}
                className="w-full text-center py-3 text-[12px] font-semibold uppercase
                           tracking-wider text-[var(--gold-dark)] hover:bg-[var(--bg-light)]
                           transition-colors"
              >
                View all results for &quot;{query}&quot; →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}