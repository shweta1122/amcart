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
  productTitle: string;
  productImage: string;
}

interface CartData {
  items: CartItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
}

function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/60x60?text=·";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  return cleaned.startsWith("http") ? cleaned : "https://placehold.co/60x60?text=·";
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
      return;
    }
    if (user) {
      api.get("/cart")
        .then(({ data }) => {
          if (data.items.length === 0) {
            router.replace("/cart");
            return;
          }
          setCart(data);
        })
        .catch(() => router.replace("/cart"))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  async function handlePlaceOrder() {
    if (!cart || cart.items.length === 0) return;

    setPlacing(true);
    try {
      const { data: order } = await api.post("/orders", {
        shippingAddress: address,
      });

      // Redirect to confirmation page
      router.push(`/order/${order.id}/confirmation`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to place order", "error");
    } finally {
      setPlacing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-9 w-9 animate-spin border-[3px] border-gray-200 border-t-[var(--gold)] rounded-full" />
      </div>
    );
  }

  if (!cart) return null;

  const shippingCost = cart.subtotal >= 999 ? 0 : 9.99;
  const total = Math.round((cart.subtotal + shippingCost) * 100) / 100;

  return (
    <>
      {toast && (
        <div className={`toast-amcart show ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
        <nav className="flex items-center gap-2 text-[12px] text-[var(--text-light)] mb-8">
          <Link href="/" className="hover:text-[var(--gold-dark)] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-[var(--gold-dark)] transition-colors">Cart</Link>
          <span>/</span>
          <span className="text-[var(--dark)]">Checkout</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-light text-[var(--dark)] mb-10" style={{ letterSpacing: "-0.3px" }}>
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Shipping + Review */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="panel-amcart">
              <div className="panel-head">
                <h3>Shipping Address</h3>
              </div>
              <div className="panel-body">
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full shipping address..."
                  rows={3}
                  className="input-amcart resize-none"
                />
              </div>
            </div>

            {/* Order Items Review */}
            <div className="panel-amcart">
              <div className="panel-head flex items-center justify-between">
                <h3>Order Items ({cart.totalQuantity})</h3>
                <Link href="/cart" className="text-[12px] text-[var(--gold-dark)] hover:underline">
                  Edit Cart
                </Link>
              </div>
              <div className="panel-body divide-y divide-[var(--border)]">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <img
                      src={cleanImageUrl(item.productImage)}
                      alt={item.productTitle}
                      className="w-14 h-14 object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/60x60?text=·"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--dark)] line-clamp-1">
                        {item.productTitle || `Product #${item.productId}`}
                      </div>
                      <div className="text-[12px] text-[var(--text-light)]">
                        Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[var(--dark)] flex-shrink-0">
                      ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment (mock) */}
            <div className="panel-amcart">
              <div className="panel-head">
                <h3>Payment Method</h3>
              </div>
              <div className="panel-body">
                <div className="flex items-center gap-3 p-4 border border-[var(--gold)] bg-[var(--gold-light)]/20">
                  <span className="text-xl">💳</span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--dark)]">Mock Payment</div>
                    <div className="text-[11px] text-[var(--text-light)]">
                      Order will be auto-confirmed. Razorpay integration coming soon.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div>
            <div className="panel-amcart sticky top-20">
              <div className="panel-head">
                <h3>Order Summary</h3>
              </div>
              <div className="panel-body space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-light)]">Subtotal ({cart.totalQuantity} items)</span>
                  <span className="text-[var(--dark)] font-semibold">${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-light)]">Shipping</span>
                  <span className={shippingCost === 0 ? "text-[var(--success)] font-medium" : "text-[var(--dark)]"}>
                    {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="h-px bg-[var(--border)]" />
                <div className="flex justify-between">
                  <span className="text-[var(--dark)] font-semibold">Total</span>
                  <span className="text-[var(--dark)] text-lg font-semibold">${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="btn-primary w-full py-3.5 text-sm mt-4 disabled:opacity-50"
                >
                  {placing ? "Placing Order..." : `Place Order · $${total.toFixed(2)}`}
                </button>

                <p className="text-[10px] text-[var(--text-light)] text-center leading-relaxed">
                  By placing this order you agree to our terms and conditions. Your payment will be processed securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}