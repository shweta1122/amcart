"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: {
    title: string;
    images: string[];
    category?: { name: string };
  };
}

interface Cart {
  items: CartItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
}

function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/100x100?text=No+Image";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  if (!cleaned.startsWith("http")) return "https://placehold.co/100x100?text=No+Image";
  return cleaned;
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart>({ items: [], itemCount: 0, totalQuantity: 0, subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }
    fetchCart();
  }, [user, authLoading, router]);

  async function fetchCart() {
    try {
      const { data } = await api.get('/cart');

      // Fetch product details for each cart item
      const itemsWithDetails = await Promise.all(
        data.items.map(async (item: CartItem) => {
          try {
            const res = await fetch(`https://api.escuelajs.co/api/v1/products/${item.productId}`);
            if (res.ok) {
              const product = await res.json();
              return {
                ...item,
                product: {
                  title: product.title,
                  images: product.images,
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

      setCart({ ...data, items: itemsWithDetails });
    } catch {
      setCart({ items: [], itemCount: 0, totalQuantity: 0, subtotal: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    setUpdating(itemId);
    try {
      await api.patch(`/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch {
      showToast("Failed to update quantity", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    try {
      await api.delete(`/cart/${itemId}`);
      await fetchCart();
      showToast("Item removed from cart");
    } catch {
      showToast("Failed to remove item", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function moveToWishlist(itemId: string) {
    setUpdating(itemId);
    try {
      await api.post(`/cart/${itemId}/move-to-wishlist`);
      await fetchCart();
      showToast("Moved to wishlist");
    } catch {
      showToast("Failed to move to wishlist", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function clearCart() {
    try {
      await api.delete("/cart");
      await fetchCart();
      showToast("Cart cleared");
    } catch {
      showToast("Failed to clear cart", "error");
    }
  }

  const subtotal = typeof cart.subtotal === 'number' ? cart.subtotal : parseFloat(cart.subtotal) || 0;

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
          <span className="text-[var(--dark)]">Cart</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-light text-[var(--dark)] mb-8" style={{ letterSpacing: "-0.3px" }}>
          Shopping Cart
          {cart && cart.totalQuantity > 0 && (
            <span className="text-[var(--text-light)] text-base font-normal ml-3">
              ({cart.totalQuantity} item{cart.totalQuantity !== 1 ? "s" : ""})
            </span>
          )}
        </h1>

        {!cart || cart.items.length === 0 ? (
          /* ── Empty Cart ── */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-light text-[var(--dark)] mb-2">Your cart is empty</h2>
            <p className="text-[var(--text-light)] text-sm mb-8">Looks like you haven&apos;t added anything yet.</p>
            <Link href="/search" className="btn-primary px-8 py-3 text-sm">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Cart Items ── */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const productTitle = item.product?.title || `Product #${item.productId}`;
                const productImage = item.product?.images?.[0]
                  ? cleanImageUrl(item.product.images[0])
                  : 'https://placehold.co/100x100?text=No+Image';
                const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0;
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div key={item.id} className="flex gap-4 border-b border-[var(--border)] pb-4">
                    <img
                      src={productImage}
                      alt={productTitle}
                      className="w-24 h-24 object-cover border border-[var(--border)]"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--dark)] mb-1">
                        <Link href={`/product/${item.productId}`} className="hover:text-[var(--gold)]">
                          {productTitle}
                        </Link>
                      </h3>
                      <p className="text-sm text-[var(--text)]">{item.product?.category?.name || 'Uncategorized'}</p>
                      <p className="text-sm font-bold text-[var(--dark)] mt-2">${unitPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-[var(--dark)]">${itemTotal.toFixed(2)}</p>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-[var(--border)]">
                          <button
                            onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating === item.id}
                            className="w-8 h-8 flex items-center justify-center text-[var(--text)] hover:bg-[var(--bg-light)] transition-colors disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-10 h-8 flex items-center justify-center text-sm font-semibold text-[var(--dark)] border-x border-[var(--border)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="w-8 h-8 flex items-center justify-center text-[var(--text)] hover:bg-[var(--bg-light)] transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => moveToWishlist(item.id)}
                          disabled={updating === item.id}
                          className="text-[11px] text-[var(--text-light)] hover:text-[var(--gold-dark)] transition-colors"
                        >
                          Move to Wishlist
                        </button>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="text-[11px] text-[var(--error)] hover:underline transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear cart */}
              <div className="flex justify-end pt-2">
                <button onClick={clearCart} className="text-[12px] text-[var(--error)] hover:underline">
                  Clear Entire Cart
                </button>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div>
              <div className="panel-amcart sticky top-20">
                <div className="panel-head">
                  <h3>Order Summary</h3>
                </div>
                <div className="panel-body space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-light)]">Subtotal ({cart.totalQuantity} items)</span>
                    <span className="text-[var(--dark)] font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-light)]">Shipping</span>
                    <span className="text-[var(--success)] font-medium">
                      {cart.subtotal >= 999 ? "Free" : "$9.99"}
                    </span>
                  </div>
                  <div className="h-px bg-[var(--border)]" />
                  <div className="flex justify-between">
                    <span className="text-[var(--dark)] font-semibold">Total</span>
                    <span className="text-[var(--dark)] text-lg font-semibold">
                      ${(cart.subtotal + (cart.subtotal >= 999 ? 0 : 9.99)).toFixed(2)}
                    </span>
                  </div>

                  {cart.subtotal < 999 && (
                    <p className="text-[11px] text-[var(--text-light)]">
                      Add ${(999 - cart.subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}

                  <Link href="/checkout" className="btn-primary w-full py-3 text-sm mt-2 text-center block">
                    Proceed to Checkout →
                  </Link>
                  <Link href="/search" className="btn-outline-gold w-full py-2.5 text-[12px] text-center block">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}