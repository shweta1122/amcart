"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";

interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  items: OrderItem[];
  createdAt: string;
}

function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/60x60?text=·";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  return cleaned.startsWith("http") ? cleaned : "https://placehold.co/60x60?text=·";
}

export default function OrderConfirmationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user && orderId) {
      api.get(`/orders/${orderId}`)
        .then(({ data }) => setOrder(data))
        .catch(() => router.replace("/orders"))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, orderId]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-9 w-9 animate-spin border-[3px] border-gray-200 border-t-[var(--gold)] rounded-full" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-10 py-16">
      {/* Success header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-[var(--success)] text-white text-3xl"
          style={{ borderRadius: 0 }}>
          ✓
        </div>
        <h1 className="text-3xl font-light text-[var(--dark)] mb-3" style={{ letterSpacing: "-0.3px" }}>
          Order Confirmed!
        </h1>
        <p className="text-[var(--text-light)] text-sm">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </div>

      {/* Order info card */}
      <div className="panel-amcart mb-6">
        <div className="panel-head flex items-center justify-between">
          <h3>Order Details</h3>
          <span className="badge badge-confirmed">{order.status}</span>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {[
              ["Order Number", order.orderNumber],
              ["Date", new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
              ["Payment", order.paymentMethod === "mock" ? "Mock (Demo)" : order.paymentMethod],
              ["Total", `$${Number(order.totalAmount).toFixed(2)}`],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[11px] text-[var(--text-light)] uppercase tracking-wider">{label}</div>
                <div className="text-sm text-[var(--dark)] font-semibold mt-1">{value}</div>
              </div>
            ))}
          </div>

          {order.shippingAddress && (
            <div className="mb-6">
              <div className="text-[11px] text-[var(--text-light)] uppercase tracking-wider mb-1">Shipping Address</div>
              <div className="text-sm text-[var(--dark)]">{order.shippingAddress}</div>
            </div>
          )}

          {/* Items */}
          <div className="border-t border-[var(--border)] pt-4">
            <div className="text-[11px] text-[var(--text-light)] uppercase tracking-wider mb-3">
              Items ({order.items.length})
            </div>
            <div className="divide-y divide-[var(--border)]">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <img
                    src={cleanImageUrl(item.productImage)}
                    alt={item.productTitle}
                    className="w-12 h-12 object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/60x60?text=·"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--dark)] font-medium line-clamp-1">{item.productTitle}</div>
                    <div className="text-[12px] text-[var(--text-light)]">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold text-[var(--dark)]">
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-[var(--border)] pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-light)]">Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-light)]">Shipping</span>
              <span className={Number(order.shippingCost) === 0 ? "text-[var(--success)]" : ""}>
                {Number(order.shippingCost) === 0 ? "Free" : `$${Number(order.shippingCost).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[var(--dark)] pt-2 border-t border-[var(--border)]">
              <span>Total</span>
              <span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/orders" className="btn-primary flex-1 py-3 text-sm text-center">
          View All Orders
        </Link>
        <Link href="/search" className="btn-outline-gold flex-1 py-3 text-sm text-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}