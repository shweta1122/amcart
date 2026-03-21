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
    // Enriched from Platzi API
    _enrichedTitle?: string;
    _enrichedImage?: string;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    subtotal: number;
    shippingCost: number;
    totalAmount: number;
    shippingAddress: string;
    paymentId: string;
    paymentMethod: string;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

function cleanImageUrl(url: string): string {
    if (!url) return "";
    let cleaned = url.replace(/^\[?"?/, "").replace(/"?\]?$/, "");
    return cleaned.startsWith("http") ? cleaned : "";
}

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login");
            return;
        }
        if (user && orderId) {
            fetchOrder();
        }
    }, [user, authLoading, orderId]);

    async function fetchOrder() {
        try {
            const { data } = await api.get(`/orders/${orderId}`);

            // Enrich items with product details from Platzi API
            const enrichedItems = await Promise.all(
                data.items.map(async (item: OrderItem) => {
                    // If we already have title and image, use them
                    const hasTitle = item.productTitle && item.productTitle.trim() !== "";
                    const hasImage = cleanImageUrl(item.productImage) !== "";

                    if (hasTitle && hasImage) return item;

                    // Otherwise fetch from Platzi API
                    try {
                        const res = await fetch(
                            `https://api.escuelajs.co/api/v1/products/${item.productId}`
                        );
                        if (res.ok) {
                            const product = await res.json();
                            return {
                                ...item,
                                _enrichedTitle: product.title,
                                _enrichedImage: product.images?.[0],
                            };
                        }
                    } catch {
                        // Silent fail — show what we have
                    }
                    return item;
                })
            );

            setOrder({ ...data, items: enrichedItems });
        } catch {
            router.replace("/orders");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!order) return;
        setCancelling(true);
        try {
            const { data } = await api.post(`/orders/${order.id}/cancel`);
            setOrder({ ...order, status: data.status });
            showToast("Order cancelled");
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to cancel order", "error");
        } finally {
            setCancelling(false);
        }
    }

    /** Get the best available title for an item */
    function getItemTitle(item: OrderItem): string {
        return item.productTitle || item._enrichedTitle || `Product #${item.productId}`;
    }

    /** Get the best available image for an item */
    function getItemImage(item: OrderItem): string {
        const stored = cleanImageUrl(item.productImage);
        if (stored) return stored;
        const enriched = cleanImageUrl(item._enrichedImage || "");
        if (enriched) return enriched;
        return "https://placehold.co/60x60?text=No+Image";
    }

    if (authLoading || loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <div className="h-9 w-9 animate-spin border-[3px] border-gray-200 border-t-[var(--gold)] rounded-full" />
            </div>
        );
    }

    if (!order) return null;

    const currentStep = STATUS_STEPS.indexOf(order.status);
    const isCancelled = order.status === "cancelled";

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
                    <Link href="/orders" className="hover:text-[var(--gold-dark)] transition-colors">Orders</Link>
                    <span>/</span>
                    <span className="text-[var(--dark)]">{order.orderNumber}</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-light text-[var(--dark)]" style={{ letterSpacing: "-0.3px" }}>
                            Order {order.orderNumber}
                        </h1>
                        <p className="text-[var(--text-light)] text-sm mt-1">
                            Placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                        </p>
                    </div>
                    {!isCancelled && currentStep < 2 && (
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="btn-danger px-6 py-2.5 text-sm"
                        >
                            {cancelling ? "Cancelling..." : "Cancel Order"}
                        </button>
                    )}
                </div>

                {/* Status tracker */}
                {!isCancelled ? (
                    <div className="panel-amcart mb-8">
                        <div className="panel-body">
                            <div className="flex items-center justify-between">
                                {STATUS_STEPS.map((step, i) => (
                                    <div key={step} className="flex-1 flex flex-col items-center relative">
                                        {i > 0 && (
                                            <div
                                                className="absolute top-4 right-1/2 w-full h-[2px]"
                                                style={{ background: i <= currentStep ? "var(--gold)" : "var(--border)" }}
                                            />
                                        )}
                                        <div
                                            className={`relative z-10 w-8 h-8 flex items-center justify-center text-xs font-bold ${i <= currentStep
                                                ? "bg-[var(--gold)] text-[var(--dark)]"
                                                : "bg-[var(--bg-light)] text-[var(--text-light)] border border-[var(--border)]"
                                                }`}
                                        >
                                            {i < currentStep ? "✓" : i + 1}
                                        </div>
                                        <div className={`text-[11px] mt-2 capitalize ${i <= currentStep ? "text-[var(--dark)] font-semibold" : "text-[var(--text-light)]"
                                            }`}>
                                            {step}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="panel-amcart mb-8 border-[var(--error)]">
                        <div className="panel-body text-center py-6">
                            <div className="text-2xl mb-2">✕</div>
                            <div className="text-[var(--error)] font-semibold">Order Cancelled</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Items */}
                    <div className="lg:col-span-2">
                        <div className="panel-amcart">
                            <div className="panel-head">
                                <h3>Items ({order.items.length})</h3>
                            </div>
                            <div className="panel-body divide-y divide-[var(--border)]">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                                        <Link
                                            href={`/product/${item.productId}`}
                                            className="flex-shrink-0 block"
                                            style={{ width: '64px', height: '64px', minWidth: '64px', overflow: 'hidden' }}
                                        >
                                            <img
                                                src={getItemImage(item)}
                                                alt={getItemTitle(item)}
                                                style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                                                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/60x60?text=No+Image"; }}
                                            />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/product/${item.productId}`}
                                                className="text-sm font-semibold text-[var(--dark)] hover:text-[var(--gold-dark)] transition-colors line-clamp-1 block"
                                            >
                                                {getItemTitle(item)}
                                            </Link>
                                            <div className="text-[12px] text-[var(--text-light)] mt-1">
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
                    </div>

                    {/* Summary sidebar */}
                    <div className="space-y-6">
                        <div className="panel-amcart">
                            <div className="panel-head"><h3>Summary</h3></div>
                            <div className="panel-body space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-light)]">Subtotal</span>
                                    <span>${Number(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-light)]">Shipping</span>
                                    <span>{Number(order.shippingCost) === 0 ? "Free" : `$${Number(order.shippingCost).toFixed(2)}`}</span>
                                </div>
                                <div className="h-px bg-[var(--border)]" />
                                <div className="flex justify-between font-semibold text-[var(--dark)]">
                                    <span>Total</span>
                                    <span>${Number(order.totalAmount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {order.shippingAddress && (
                            <div className="panel-amcart">
                                <div className="panel-head"><h3>Shipping Address</h3></div>
                                <div className="panel-body">
                                    <p className="text-sm text-[var(--dark)]">{order.shippingAddress}</p>
                                </div>
                            </div>
                        )}

                        <div className="panel-amcart">
                            <div className="panel-head"><h3>Payment</h3></div>
                            <div className="panel-body space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-light)]">Method</span>
                                    <span className="text-[var(--dark)]">{order.paymentMethod === "mock" ? "Mock (Demo)" : order.paymentMethod}</span>
                                </div>
                                {order.paymentId && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-light)]">Payment ID</span>
                                        <span className="text-[var(--dark)] text-[12px] font-mono">{order.paymentId}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Back to orders */}
                        <Link href="/orders" className="btn-outline-gold w-full py-2.5 text-[12px] text-center block">
                            ← Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}