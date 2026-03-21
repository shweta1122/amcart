'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  // Password strength
  const pwStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const widths = [0, 20, 40, 60, 80, 100];
    const colors = ['#eee', '#d94452', '#ef8c1a', '#dccc99', '#4caf50', '#2e7d32'];
    return { width: widths[score], color: colors[score] };
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }
      router.push('/dashboard');
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin border-4 border-[var(--gold)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-[var(--bg-light)] px-4 py-3.5">
        <div className="mx-auto flex max-w-[1170px] items-center gap-2 text-xs text-[var(--text-light)]">
          <Link href="/" className="hover:text-[var(--gold)]">Home</Link>
          <span className="text-gray-300">›</span>
          <span className="font-semibold text-[var(--dark-2)]">Create Account</span>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="panel-amcart">
            <div className="panel-head">
              <h3>Create Your Account</h3>
            </div>
            <div className="panel-body">

              {/* Google */}
              <p className="mb-3 text-center text-xs text-gray-400">Register using</p>
              <button onClick={handleGoogleSignUp} disabled={loading} className="social-google mb-5">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" fillOpacity=".8"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".9"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity=".7"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".85"/>
                </svg>
                Sign up with Google
              </button>

              <div className="divider-text"><span>or register with email</span></div>

              {error && (
                <div className="mb-4 border border-red-200 bg-red-50 p-3 text-xs text-[var(--error)]">{error}</div>
              )}

              <form onSubmit={handleRegister}>
                <div className="mb-4">
                  <label htmlFor="name" className="mb-1.5 block text-xs text-[var(--text)]">
                    Full Name <span className="text-[var(--error)]">*</span>
                  </label>
                  <input id="name" type="text" required value={name}
                    onChange={(e) => setName(e.target.value)} className="input-amcart" placeholder="John Doe" />
                </div>

                <div className="mb-4">
                  <label htmlFor="reg-email" className="mb-1.5 block text-xs text-[var(--text)]">
                    Email Address <span className="text-[var(--error)]">*</span>
                  </label>
                  <input id="reg-email" type="email" autoComplete="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} className="input-amcart" placeholder="you@example.com" />
                </div>

                <div className="mb-4">
                  <label htmlFor="reg-password" className="mb-1.5 block text-xs text-[var(--text)]">
                    Password <span className="text-[var(--error)]">*</span>
                  </label>
                  <input id="reg-password" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} className="input-amcart" placeholder="Min 6 characters" />
                  {password && (
                    <div className="pw-bar-track">
                      <div className="pw-bar-fill" style={{ width: `${pwStrength.width}%`, background: pwStrength.color }} />
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="reg-confirm" className="mb-1.5 block text-xs text-[var(--text)]">
                    Confirm Password <span className="text-[var(--error)]">*</span>
                  </label>
                  <input id="reg-confirm" type="password" required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input-amcart ${confirmPassword && password !== confirmPassword ? '!border-[var(--error)]' : ''}`}
                    placeholder="••••••••" />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-[11px] text-[var(--error)]">Passwords do not match</p>
                  )}
                </div>

                <button type="submit" disabled={loading} className="btn-secondary w-full py-3 text-sm">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </form>

              <div className="mt-5 border-t border-gray-200 pt-5 text-center text-xs text-[var(--text-light)]">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-[var(--gold)] hover:text-[var(--gold-dark)]">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}