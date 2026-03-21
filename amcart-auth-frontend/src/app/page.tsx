"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

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

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Free Delivery Above ₹999",
  "New Arrivals Every Week",
  "Secure Checkout via Razorpay",
  "30-Day Easy Returns",
  "Top Brands · Best Prices",
  "Shop Men · Women · Kids · Electronics",
];

/**
 * Category cards on the landing page.
 * href now points to /search with the Platzi API categoryId.
 *
 * Platzi categories:
 *   1 = Clothes, 2 = Electronics, 3 = Furniture,
 *   4 = Shoes,   5 = Miscellaneous
 *
 * AmCart maps:
 *   Men → Clothes (1), Women → Shoes (4),
 *   Kids → Miscellaneous (5), Electronics → Electronics (2)
 */
const CATEGORIES = [
  {
    label: "Men",
    emoji: "👔",
    href: "/search?category=1",
    desc: "Sharp essentials for the modern man",
  },
  {
    label: "Women",
    emoji: "👗",
    href: "/search?category=4",
    desc: "Effortless elegance, every season",
  },
  {
    label: "Kids",
    emoji: "🧒",
    href: "/search?category=5",
    desc: "Playful styles they'll love",
  },
  {
    label: "Electronics",
    emoji: "⚡",
    href: "/search?category=2",
    desc: "Tech that fits your lifestyle",
  },
];

const FEATURES = [
  { icon: "🚚", title: "Free Delivery", desc: "On all orders above ₹999" },
  { icon: "↩️", title: "Easy Returns", desc: "30-day hassle-free returns" },
  { icon: "🔒", title: "Secure Payments", desc: "Razorpay-powered checkout" },
  { icon: "⭐", title: "Top Rated", desc: "Loved by 10,000+ customers" },
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/400x400?text=No+Image";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  if (!cleaned.startsWith("http")) {
    return "https://placehold.co/400x400?text=No+Image";
  }
  return cleaned;
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && user) {
      router.replace("/dashboard");
    }
  }, [mounted, user, authLoading, router]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(
          "https://api.escuelajs.co/api/v1/products?offset=0&limit=8"
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Product[] = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-9 w-9 animate-spin border-[3px] border-gray-200 border-t-[var(--gold)] rounded-full" />
        <p className="text-sm text-[var(--text-light)]">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker-scroll 22s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-ready .fu { opacity: 0; animation: fadeUp 0.6s ease forwards; }
        .fu-1 { animation-delay: 0.05s !important; }
        .fu-2 { animation-delay: 0.15s !important; }
        .fu-3 { animation-delay: 0.25s !important; }
        .fu-4 { animation-delay: 0.35s !important; }
        .fu-5 { animation-delay: 0.45s !important; }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        .float-anim { animation: floatY 4s ease-in-out infinite; }
      `}</style>

      <div className={visible ? "anim-ready" : ""} ref={heroRef}>
        {/* ═══ HERO ═══ */}
        <section className="bg-[var(--dark)] overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="fu fu-1 flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-[var(--gold)]" />
                <span className="text-[var(--gold)] text-[11px] font-semibold tracking-[3px] uppercase">
                  New Season 2025
                </span>
              </div>

              <h1
                className="fu fu-2 text-white font-light leading-[1.08] mb-6"
                style={{ fontSize: "clamp(38px, 5vw, 68px)", letterSpacing: "-1px" }}
              >
                Style That{" "}
                <span className="text-[var(--gold)] italic">Speaks</span>
                <br />For You.
              </h1>

              <p className="fu fu-3 text-[var(--text-light)] text-[15px] leading-relaxed mb-10 max-w-md font-light">
                Discover curated collections across fashion &amp; electronics —
                designed for every taste, delivered to your door.
              </p>

              <div className="fu fu-4 flex flex-wrap gap-4 items-center">
                <Link href="/search" className="btn-secondary text-sm px-8 py-3">
                  Shop Now →
                </Link>
                <Link
                  href="/login"
                  className="text-[var(--gold)] text-[13px] tracking-wide border-b border-[var(--gold-dark)]
                             pb-px hover:text-white hover:border-white transition-colors"
                >
                  Sign in to your account
                </Link>
              </div>

              <div className="fu fu-5 flex items-center gap-8 mt-10 pt-10 border-t border-white/10">
                {[["10K+", "Happy Customers"], ["500+", "Products"], ["4.8★", "Avg Rating"]].map(
                  ([val, lbl]) => (
                    <div key={lbl}>
                      <div className="text-[var(--gold)] text-xl font-semibold">{val}</div>
                      <div className="text-[var(--text-light)] text-[11px] tracking-wide uppercase mt-0.5">{lbl}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="hidden md:flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(220,204,153,0.15) 0%, transparent 70%)" }} />
              </div>
              <span className="float-anim text-[130px] leading-none select-none" style={{ filter: "drop-shadow(0 20px 36px rgba(220,204,153,0.2))" }}>
                🛍️
              </span>
              <div className="absolute top-8 left-6 bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-3">
                <div className="text-[var(--gold)] text-lg font-semibold">₹499</div>
                <div className="text-[11px] text-white/40 uppercase tracking-wider mt-0.5">Starting From</div>
              </div>
              <div className="absolute bottom-10 right-6 bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-3">
                <div className="text-[var(--gold)] text-lg font-semibold">50% Off</div>
                <div className="text-[11px] text-white/40 uppercase tracking-wider mt-0.5">Sale On Now</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TICKER ═══ */}
        <div className="bg-[var(--gold)] overflow-hidden py-2.5 select-none">
          <div className="ticker-track flex whitespace-nowrap gap-14 w-max">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="text-[var(--dark)] text-[11px] font-semibold tracking-[2px] uppercase flex items-center gap-14">
                {item}
                <span className="text-[8px] opacity-40">◆</span>
              </span>
            ))}
          </div>
        </div>

        {/* ═══ CATEGORIES ═══ */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-10 py-20">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-[var(--gold)]" />
            <span className="text-[var(--gold-dark)] text-[11px] font-semibold tracking-[3px] uppercase">
              Shop by Category
            </span>
          </div>
          <h2 className="text-[var(--dark)] text-3xl md:text-4xl font-light mb-12" style={{ letterSpacing: "-0.5px" }}>
            Find Your Style
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group bg-[var(--dark)] relative overflow-hidden block transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gold)] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                <div className="p-8 md:p-10">
                  <span className="text-5xl mb-5 block">{cat.emoji}</span>
                  <div className="text-white text-lg font-light mb-2 tracking-wide">{cat.label}</div>
                  <div className="text-white/40 text-[12px] leading-relaxed">{cat.desc}</div>
                  <div className="text-[var(--gold)] text-lg mt-6 opacity-0 -translate-x-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <div className="bg-[var(--bg-light)] border-y border-[var(--border)]">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--border)]">
              {FEATURES.map((f) => (
                <div key={f.title} className="py-8 px-6 md:px-8">
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <div className="text-[var(--dark)] text-sm font-semibold mb-1">{f.title}</div>
                  <div className="text-[var(--text-light)] text-[12px]">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ TRENDING PRODUCTS ═══ */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-10 py-20">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="h-px w-8 bg-[var(--gold)]" />
                <span className="text-[var(--gold-dark)] text-[11px] font-semibold tracking-[3px] uppercase">Trending Now</span>
              </div>
              <h2 className="text-[var(--dark)] text-3xl md:text-4xl font-light" style={{ letterSpacing: "-0.5px" }}>Most Loved Picks</h2>
            </div>
            <Link href="/search" className="btn-outline-gold text-[12px] px-6 py-2.5 tracking-widest">View All →</Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="panel-amcart animate-pulse">
                  <div className="bg-gray-100 h-52" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-100 w-3/4" />
                    <div className="h-3 bg-gray-100 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image"; }}
                    />
                    <div className="absolute top-3 left-3 bg-[var(--dark)] text-[var(--gold)] text-[10px] font-bold tracking-[1.5px] uppercase px-2.5 py-1">
                      {product.category?.name || "Product"}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[var(--text)] text-sm font-semibold mb-1.5 line-clamp-1">{product.title}</div>
                    <div className="text-[var(--text-light)] text-[11px] mb-3 line-clamp-2 leading-relaxed">{product.description}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--dark)] text-sm font-semibold">${product.price}</span>
                      <span className="btn-primary text-[10px] px-3 py-1.5 tracking-wider">View Details</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ═══ PROMO BANNER ═══ */}
        <section className="px-6 md:px-10 pb-20 max-w-[1280px] mx-auto">
          <div className="bg-[var(--dark)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: "radial-gradient(circle at top right, var(--gold), transparent 70%)" }} />
            <div className="h-[3px] bg-[var(--gold)] w-full" />
            <div className="relative z-10 px-10 md:px-16 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <div className="text-[var(--gold)] text-[11px] font-semibold tracking-[3px] uppercase mb-4">Limited Time Offer</div>
                <div className="text-white text-3xl md:text-4xl font-light leading-tight mb-3" style={{ letterSpacing: "-0.5px" }}>
                  Up to <span className="text-[var(--gold)] font-semibold">50% Off</span><br />Sale Collection
                </div>
                <div className="text-white/40 text-sm font-light">Don&apos;t miss out — limited stock available.</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link href="/search" className="btn-secondary px-10 py-3.5 text-[13px]">Explore Sale →</Link>
                <Link href="/register" className="btn-outline-gold px-8 py-3.5 text-[13px]">Create Account</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TRUST ═══ */}
        <section className="bg-[var(--bg-light)] border-t border-[var(--border)] py-16">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10 text-center">
            <p className="text-[var(--text-light)] text-[12px] tracking-[2px] uppercase mb-8">Powered By</p>
            <div className="flex justify-center items-center gap-10 flex-wrap opacity-30 grayscale">
              {["Razorpay", "Amazon SES", "AWS", "Vercel", "PostgreSQL"].map((b) => (
                <span key={b} className="text-[var(--dark)] font-semibold text-sm tracking-wide">{b}</span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}