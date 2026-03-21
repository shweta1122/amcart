'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import api from '@/lib/api';

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    api.get('/api/cart')
      .then(({ data }) => setCartCount(data.totalQuantity || 0))
      .catch(() => setCartCount(0));
    api.get('/api/wishlist')
      .then(({ data }) => setWishlistCount(data.itemCount || 0))
      .catch(() => setWishlistCount(0));
  }, [user, pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  /** Navigate to a protected page — redirect to login if not authenticated */
  const goProtected = (href: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    } else {
      router.push(href);
    }
  };

  const NAV_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'Men', href: '/search?category=1' },
    { label: 'Women', href: '/search?category=4' },
    { label: 'Kids', href: '/search?category=5' },
    { label: 'Electronics', href: '/search?category=2' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header>
      {/* ── Top Bar ── */}
      <div className="topbar">
        <div className="mx-auto flex w-full max-w-[1170px] items-center justify-between px-4">
          <div className="hidden items-center gap-5 sm:flex">
            <a href="tel:+918002364332" className="flex items-center gap-1.5">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.58 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              +91 (800) 2364 332
            </a>
            <a href="mailto:support@amcart.store" className="flex items-center gap-1.5">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" />
              </svg>
              support@amcart.store
            </a>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {loading ? (
              <span className="text-gray-600 text-xs">...</span>
            ) : user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-1 text-[var(--gold)] hover:text-[var(--gold-dark)] transition-colors">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full border border-[var(--gold)] object-cover" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--dark)] text-[9px] font-bold">
                      {getInitials(user.displayName || user.email)}
                    </span>
                  )}
                  <span className="hidden sm:inline">{user.displayName || user.email?.split('@')[0]}</span>
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 hover:text-[var(--gold)] transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-1.5 px-3 hover:text-[var(--gold)] transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Login
                </Link>
                <Link href="/register" className="flex items-center gap-1.5 px-3 hover:text-[var(--gold)] transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Header Bar ── */}
      <div className="border-b border-gray-100 bg-white py-4">
        <div className="mx-auto flex w-full max-w-[1170px] items-center justify-between px-4">
          <Link href="/" className="text-[28px] font-bold tracking-tight text-[var(--dark)] no-underline">
            Am<span className="text-[var(--gold)]">Cart</span>
          </Link>

          <SearchBar />

          {/* Wishlist & Cart — always visible, redirect to login if not auth'd */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => goProtected('/wishlist')}
              className="group relative flex items-center gap-1.5 text-[var(--dark-2)] hover:text-[var(--gold)] transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              <span className="hidden text-[13px] sm:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold)] text-[9px] font-bold text-[var(--dark)]">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => goProtected('/cart')}
              className="group relative flex items-center gap-1.5 text-[var(--dark-2)] hover:text-[var(--gold)] transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <span className="hidden text-[13px] sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold)] text-[9px] font-bold text-[var(--dark)]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="main-nav-bar">
        <div className="mx-auto flex w-full max-w-[1170px] items-center px-4">
          <button className="mr-4 text-[var(--gold)] md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>

          <ul className="hidden list-none gap-0 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={`nav-link ${pathname === link.href ? 'active' : ''}`}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li><Link href="/search?q=sale" className="nav-link !bg-[var(--gold)] !text-[var(--dark)]">Sale</Link></li>
          </ul>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-800 md:hidden">
            <ul className="list-none">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="nav-link" onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>
                </li>
              ))}
              <li><Link href="/search?q=sale" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Sale</Link></li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}