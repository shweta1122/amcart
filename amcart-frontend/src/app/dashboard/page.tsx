"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  role: string;
  authProvider: string;
  emailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
}

interface CartSummary {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
}

interface WishlistSummary {
  itemCount: number;
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [wishlistSummary, setWishlistSummary] = useState<WishlistSummary | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    api.get("/auth/profile")
      .then(({ data }) => setProfile(data.user))
      .catch(console.error)
      .finally(() => setProfileLoading(false));

    api.get("/cart")
      .then(({ data }) => setCartSummary(data))
      .catch(() => setCartSummary({ itemCount: 0, totalQuantity: 0, subtotal: 0 }));

    api.get("/wishlist")
      .then(({ data }) => setWishlistSummary(data))
      .catch(() => setWishlistSummary({ itemCount: 0 }));

    api.get("/orders")
      .then(({ data }) => setOrderCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setOrderCount(0));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-9 w-9 animate-spin border-[3px] border-gray-200 border-t-[var(--gold)] rounded-full" />
        <p className="text-sm text-[var(--text-light)]">Loading...</p>
      </div>
    );
  }

  const displayName =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user.displayName ||
    user.email ||
    "User";

  const subtotal = cartSummary?.subtotal ?? 0;
  const safeSubtotal = typeof subtotal === "number" ? subtotal : parseFloat(String(subtotal)) || 0;

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          {user.photoURL || profile?.photoUrl ? (
            <img src={user.photoURL || profile?.photoUrl || ""} alt="Avatar" className="w-14 h-14 object-cover border-2 border-[var(--gold)]" />
          ) : (
            <div className="w-14 h-14 flex items-center justify-center bg-[var(--dark)] text-[var(--gold)] text-xl font-semibold">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-light text-[var(--dark)]">
              Welcome back, <span className="font-semibold">{displayName.split(" ")[0]}</span>
            </h1>
            <p className="text-[var(--text-light)] text-sm mt-0.5">Member since {memberSince}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/search" className="btn-primary px-6 py-2.5 text-sm">Browse Products</Link>
          <button onClick={handleSignOut} className="btn-outline-gold px-6 py-2.5 text-sm">Sign Out</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: "Cart Items",
            value: cartSummary?.totalQuantity ?? "—",
            sub: cartSummary ? `$${safeSubtotal.toFixed(2)} subtotal` : "Loading...",
            href: "/cart",
            icon: "🛒",
          },
          {
            label: "Wishlist",
            value: wishlistSummary?.itemCount ?? "—",
            sub: "Saved items",
            href: "/wishlist",
            icon: "♥",
          },
          {
            label: "Orders",
            value: orderCount,
            sub: orderCount > 0 ? `${orderCount} order${orderCount !== 1 ? "s" : ""} placed` : "No orders yet",
            href: "/orders",
            icon: "📦",
          },
          {
            label: "Account",
            value: profile?.role || "—",
            sub: profile?.emailVerified ? "Verified" : "Not verified",
            href: "/account",
            icon: "👤",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="panel-amcart group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-[var(--gold-dark)] text-sm opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
              <div className="text-[var(--dark)] text-2xl font-semibold mb-1">{stat.value}</div>
              <div className="text-[var(--text-light)] text-[12px] uppercase tracking-wider">{stat.label}</div>
              <div className="text-[var(--text-light)] text-[11px] mt-1">{stat.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="panel-amcart">
            <div className="panel-head"><h3>Quick Actions</h3></div>
            <div className="panel-body">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Browse Products", href: "/search", icon: "🔍" },
                  { label: "View Cart", href: "/cart", icon: "🛒" },
                  { label: "My Wishlist", href: "/wishlist", icon: "♥" },
                  { label: "Order History", href: "/orders", icon: "📋" },
                  { label: "Account Settings", href: "/account", icon: "⚙️" },
                  { label: "Help & Support", href: "/contact", icon: "💬" },
                ].map((action) => (
                  <Link key={action.label} href={action.href}
                    className="flex items-center gap-3 p-4 border border-[var(--border)] hover:border-[var(--gold)] hover:bg-[var(--bg-light)] transition-all duration-200 group">
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-sm text-[var(--text)] group-hover:text-[var(--dark)] font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="panel-amcart mt-6">
            <div className="panel-head"><h3>Recent Activity</h3></div>
            <div className="panel-body">
              {cartSummary && cartSummary.itemCount > 0 ? (
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🛒</span>
                    <div>
                      <div className="text-sm text-[var(--dark)] font-medium">
                        You have {cartSummary.totalQuantity} item{cartSummary.totalQuantity !== 1 ? "s" : ""} in your cart
                      </div>
                      <div className="text-[11px] text-[var(--text-light)]">Subtotal: ${safeSubtotal.toFixed(2)}</div>
                    </div>
                  </div>
                  <Link href="/cart" className="text-[var(--gold-dark)] text-sm font-semibold hover:underline">View Cart →</Link>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🛍️</div>
                  <p className="text-[var(--text-light)] text-sm mb-4">Your cart is empty. Start shopping!</p>
                  <Link href="/search" className="btn-primary px-6 py-2 text-sm">Browse Products</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="panel-amcart">
            <div className="panel-head"><h3>Your Profile</h3></div>
            <div className="panel-body">
              {profileLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 bg-gray-100 w-3/4" />
                  <div className="h-3 bg-gray-100 w-1/2" />
                  <div className="h-3 bg-gray-100 w-2/3" />
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  {[
                    ["Email", profile.email],
                    ["Name", [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—"],
                    ["Role", profile.role],
                    ["Auth", profile.authProvider === "google" ? "Google" : "Email & Password"],
                    ["Verified", profile.emailVerified ? "Yes" : "Not yet"],
                    ["Last Login", new Date(profile.lastLoginAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[11px] text-[var(--text-light)] uppercase tracking-wider">{label}</div>
                      <div className="text-sm text-[var(--dark)] font-medium mt-0.5">{value}</div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-[var(--border)]">
                    {profile.emailVerified ? (
                      <div className="flex items-center gap-2 text-[var(--success)] text-sm">
                        <span>✓</span><span className="font-medium">Verified Account</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[var(--text-light)] text-sm">
                        <span>○</span><span>Please verify your email</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-light)]">Could not load profile</p>
              )}
            </div>
          </div>

          <div className="panel-amcart mt-6">
            <div className="panel-body">
              <div className="space-y-4">
                {[
                  ["🚚", "Free Delivery", "On orders above ₹999"],
                  ["↩️", "Easy Returns", "30-day return policy"],
                  ["🔒", "Secure Payments", "Powered by Razorpay"],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{icon}</span>
                    <div>
                      <div className="text-sm text-[var(--dark)] font-semibold">{title}</div>
                      <div className="text-[11px] text-[var(--text-light)]">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}