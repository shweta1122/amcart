"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: { id: string; productTitle: string; productImage: string; quantity: number; unitPrice: number }[];
  createdAt: string;
}

function cleanImageUrl(url: string): string {
  if (!url) return "https://placehold.co/48x48?text=·";
  let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
  return cleaned.startsWith("http") ? cleaned : "https://placehold.co/48x48?text=·";
}

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-pending",
  confirmed: "badge-confirmed",
  shipped: "badge-shipped",
  delivered: "badge-delivered",
  cancelled: "badge-pending",
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/orders");
      return;
    }
    if (user) {
      api.get("/orders")
        .then(({ data }) => setOrders(data))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-9 w-9 animate-spin border-[3px] border-gray-200 border-t-[var(--gold)] rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
      <nav className="flex items-center gap-2 text-[12px] text-[var(--text-light)] mb-8">
        <Link href="/" className="hover:text-[var(--gold-dark)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-[var(--gold-dark)] transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-[var(--dark)]">Orders</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-light text-[var(--dark)] mb-10" style={{ letterSpacing: "-0.3px" }}>
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-light text-[var(--dark)] mb-2">No orders yet</h2>
          <p className="text-[var(--text-light)] text-sm mb-8">When you place an order, it will appear here.</p>
          <Link href="/search" className="btn-primary px-8 py-3 text-sm">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className="panel-amcart block hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[var(--dark)]">{order.orderNumber}</div>
                      <div className="text-[12px] text-[var(--text-light)]">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${STATUS_BADGE[order.status] || "badge-pending"}`}>
                      {order.status}
                    </span>
                    <span className="text-[var(--dark)] font-semibold">
                      ${Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Item thumbnails */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 4).map((item) => (
                      <img
                        key={item.id}
                        src={cleanImageUrl(item.productImage)}
                        alt={item.productTitle}
                        className="w-10 h-10 object-cover border-2 border-white"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=·"; }}
                      />
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-10 h-10 flex items-center justify-center bg-[var(--bg-light)] border-2 border-white text-[10px] font-semibold text-[var(--text-light)]">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--text-light)]">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </div>
                  <span className="ml-auto text-[var(--gold-dark)] text-sm font-semibold">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}