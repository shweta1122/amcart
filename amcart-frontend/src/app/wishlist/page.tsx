"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface WishlistItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  unitPrice: number;
  createdAt: string;
  // Add full product details
  product?: {
    title: string;
    images: string[];
    price: number;
    category?: { name: string };
  };
}

interface WishlistData {
  items: WishlistItem[];
  itemCount: number;
}

function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/200x200?text=No+Image";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  return cleaned.startsWith("http") ? cleaned : "https://placehold.co/200x200?text=No+Image";
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/wishlist");
      return;
    }
    if (user) fetchWishlist();
  }, [user, authLoading]);

  async function fetchWishlist() {
    try {
      const { data } = await api.get("/wishlist");
      
      // Fetch product details for each wishlist item
      const itemsWithDetails = await Promise.all(
        data.items.map(async (item: WishlistItem) => {
          try {
            const res = await fetch(`https://api.escuelajs.co/api/v1/products/${item.productId}`);
            if (res.ok) {
              const product = await res.json();
              return {
                ...item,
                product: {
                  title: product.title,
                  images: product.images,
                  price: product.price,
                  category: product.category,
                },
              };
            }
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}`, error);
          }
          return item;
        })
      );

      setWishlist({ ...data, items: itemsWithDetails });
    } catch {
      setWishlist({ items: [], itemCount: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    try {
      await api.delete(`/wishlist/${itemId}`);
      await fetchWishlist();
      showToast("Removed from wishlist");
    } catch {
      showToast("Failed to remove item", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function moveToCart(itemId: string) {
    setUpdating(itemId);
    try {
      await api.post(`/wishlist/${itemId}/move-to-cart`);
      await fetchWishlist();
      showToast("Moved to cart");
    } catch {
      showToast("Failed to move to cart", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function clearWishlist() {
    try {
      await api.delete("/wishlist");
      await fetchWishlist();
      showToast("Wishlist cleared");
    } catch {
      showToast("Failed to clear wishlist", "error");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-9 w-9 animate-spin border-[3px] border-gray-200 border-t-[var(--gold)] rounded-full" />
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className={`toast-amcart show ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-[var(--text-light)] mb-8">
          <Link href="/" className="hover:text-[var(--gold-dark)] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[var(--dark)]">Wishlist</span>
        </nav>

        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-2xl md:text-3xl font-light text-[var(--dark)]" style={{ letterSpacing: "-0.3px" }}>
            My Wishlist
            {wishlist && wishlist.itemCount > 0 && (
              <span className="text-[var(--text-light)] text-base font-normal ml-3">
                ({wishlist.itemCount} item{wishlist.itemCount !== 1 ? "s" : ""})
              </span>
            )}
          </h1>
          {wishlist && wishlist.items.length > 1 && (
            <button onClick={clearWishlist} className="text-[12px] text-[var(--error)] hover:underline">
              Clear All
            </button>
          )}
        </div>

        {!wishlist || wishlist.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">♡</div>
            <h2 className="text-xl font-light text-[var(--dark)] mb-2">Your wishlist is empty</h2>
            <p className="text-[var(--text-light)] text-sm mb-8">Save items you love for later.</p>
            <Link href="/search" className="btn-primary px-8 py-3 text-sm">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {wishlist.items.map((item) => {
              const productTitle = item.product?.title || item.productTitle || `Product #${item.productId}`;
              const productImage = item.product?.images?.[0] 
                ? cleanImageUrl(item.product.images[0]) 
                : cleanImageUrl(item.productImage);
              const price = item.product?.price || item.unitPrice || 0;

              return (
                <div
                  key={item.id}
                  className={`panel-amcart group transition-all duration-200 ${updating === item.id ? "opacity-50" : ""}`}
                >
                  {/* Image */}
                  <Link href={`/product/${item.productId}`} className="block">
                    <div className="bg-[var(--bg-light)] h-52 relative overflow-hidden">
                      <img
                        src={productImage}
                        alt={productTitle}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=No+Image"; }}
                      />
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.preventDefault(); removeItem(item.id); }}
                        disabled={updating === item.id}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                                   bg-white border border-[var(--border)] text-[var(--error)]
                                   hover:bg-[var(--error)] hover:text-white hover:border-[var(--error)]
                                   transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link href={`/product/${item.productId}`} className="text-sm font-semibold text-[var(--dark)] hover:text-[var(--gold-dark)] transition-colors line-clamp-1 block">
                      {productTitle}
                    </Link>
                    {price > 0 && (
                      <div className="text-[var(--dark)] text-sm font-semibold mt-1">
                        ${Number(price).toFixed(2)}
                      </div>
                    )}
                    <button
                      onClick={() => moveToCart(item.id)}
                      disabled={updating === item.id}
                      className="btn-primary w-full py-2 text-[11px] mt-3"
                    >
                      {updating === item.id ? "Moving..." : "Move to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}