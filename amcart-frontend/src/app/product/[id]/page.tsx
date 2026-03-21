"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";

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
   HELPERS
───────────────────────────────────────────── */
function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/600x600?text=No+Image";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  if (!cleaned.startsWith("http")) return "https://placehold.co/600x600?text=No+Image";
  return cleaned;
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "details">("description");

  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch product from Platzi API (public, no auth needed)
  useEffect(() => {
    if (!productId) return;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`https://api.escuelajs.co/api/v1/products/${productId}`);
        if (!res.ok) throw new Error("Product not found");

        const data = await res.json();
        setProduct(data);

        // Fetch related products
        if (data.category?.id) {
          const relRes = await fetch(`https://api.escuelajs.co/api/v1/products?categoryId=${data.category.id}&limit=4`);
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelatedProducts(relData.filter((p: Product) => p.id !== data.id).slice(0, 4));
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  // Check wishlist status
  useEffect(() => {
    if (!product || !user) return;

    api.get(`/wishlist/check/${product.id}`)
      .then(({ data }) => setIsWishlisted(data.wishlisted))
      .catch(() => {});
  }, [product, user]);

  /* ── ADD TO CART ── */
  async function handleAddToCart() {
    if (!product) return;
    if (!user) {
      router.push(`/login?redirect=/product/${product.id}`);
      return;
    }

    setAddingToCart(true);
    try {
      await api.post("/cart", { 
        productId: String(product.id),  // Convert to string
        quantity,
        unitPrice: product.price  // Add unitPrice
      });
      showToast(`Added ${quantity} item(s) to cart!`, "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add to cart", "error");
    } finally {
      setAddingToCart(false);
    }
  }

  /* ── TOGGLE WISHLIST ── */
  async function handleToggleWishlist() {
    if (!product) return;
    if (!user) {
      router.push(`/login?redirect=/product/${product.id}`);
      return;
    }

    setTogglingWishlist(true);
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${product.id}`);
        setIsWishlisted(false);
        showToast("Removed from wishlist", "success");
      } else {
        await api.post("/wishlist", { 
          productId: String(product.id)  // Convert to string
        });
        setIsWishlisted(true);
        showToast("Added to wishlist!", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update wishlist", "error");
    } finally {
      setTogglingWishlist(false);
    }
  }

  /* ── BUY NOW ── */
  async function handleBuyNow() {
    await handleAddToCart();
    if (user) router.push("/checkout");
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text)]">Loading product...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-[var(--error)] text-lg mb-4">{error || "Product not found"}</p>
          <button type="button" onClick={() => router.back()} className="btn-primary px-8 py-3">← Go Back</button>
        </div>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images.map(cleanImageUrl)
    : ["https://placehold.co/600x600?text=No+Image"];

  return (
    <div className="min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded shadow-lg text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-light)] py-3">
        <div className="mx-auto max-w-[1170px] px-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text)]">
            <Link href="/" className="hover:text-[var(--gold)] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/search?category=${product.category?.id}`} className="hover:text-[var(--gold)] transition-colors">
              {product.category?.name || "Products"}
            </Link>
            <span>/</span>
            <span className="text-[var(--dark)] font-medium">{product.title}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="mx-auto max-w-[1170px] px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="mb-4 border border-[var(--border)] overflow-hidden">
              <img src={images[selectedImage]} alt={product.title} className="w-full h-auto object-cover" />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`border overflow-hidden ${selectedImage === i ? "border-[var(--gold)]" : "border-[var(--border)]"}`}
                  >
                    <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-auto object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-[var(--dark)] mb-2">{product.title}</h1>
            <p className="text-[var(--text)] mb-4">
              Category: <Link href={`/search?category=${product.category?.id}`} className="text-[var(--gold)] hover:underline">{product.category?.name}</Link>
            </p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-[var(--dark)]">${product.price.toFixed(2)}</span>
            </div>

            {/* Quantity + Add to Cart + Wishlist */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-[var(--border)]">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-[var(--text)] hover:bg-[var(--bg-light)] transition-colors text-lg">−</button>
                <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold text-[var(--dark)] border-x border-[var(--border)]">{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-[var(--text)] hover:bg-[var(--bg-light)] transition-colors text-lg">+</button>
              </div>

              <button type="button" onClick={handleAddToCart} disabled={addingToCart} className="btn-primary flex-1 py-3 text-sm disabled:opacity-50">
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={togglingWishlist}
                className={`w-10 h-10 flex items-center justify-center border transition-colors ${
                  isWishlisted
                    ? "border-[var(--error)] text-[var(--error)]"
                    : "border-[var(--border)] text-[var(--text-light)] hover:text-[var(--error)] hover:border-[var(--error)]"
                }`}
              >
                {isWishlisted ? "♥" : "♡"}
              </button>
            </div>

            <button type="button" onClick={handleBuyNow} disabled={addingToCart} className="btn-secondary w-full py-3 text-sm mb-6 disabled:opacity-50">
              {addingToCart ? "Processing..." : "Buy Now →"}
            </button>

            <div className="border border-[var(--border)] p-4 text-sm text-[var(--text)]">
              <p className="mb-2">✓ Free shipping on orders over $50</p>
              <p className="mb-2">✓ 30-day return policy</p>
              <p>✓ Secure checkout</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-16">
          <div className="flex border-b border-[var(--border)]">
            {(["description", "details"] as const).map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium tracking-wide uppercase transition-colors relative ${
                  activeTab === tab ? "text-[var(--dark)]" : "text-[var(--text-light)] hover:text-[var(--dark)]"
                }`}
              >
                {tab}
                {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--gold)]" />}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="text-[var(--text)] leading-relaxed max-w-3xl">
                <p>{product.description}</p>
              </div>
            )}
            {activeTab === "details" && (
              <div className="text-[var(--text)] space-y-2">
                <p><strong>Product ID:</strong> {product.id}</p>
                <p><strong>Category:</strong> {product.category?.name}</p>
                <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--dark)] mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => {
                const rpImg = rp.images?.[0] ? cleanImageUrl(rp.images[0]) : "https://placehold.co/300x300?text=No+Image";
                return (
                  <Link key={rp.id} href={`/product/${rp.id}`} className="group">
                    <div className="border border-[var(--border)] overflow-hidden mb-3">
                      <img src={rpImg} alt={rp.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <h3 className="text-sm font-medium text-[var(--dark)] mb-1 group-hover:text-[var(--gold)] transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    <p className="text-sm font-bold text-[var(--dark)]">${rp.price.toFixed(2)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}