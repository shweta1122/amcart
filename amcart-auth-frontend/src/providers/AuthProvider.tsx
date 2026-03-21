'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signOut as firebaseSignOut, User } from '@/lib/firebase';
import { User as FirebaseUser } from "firebase/auth";
import api from '@/lib/api';

interface AuthUser {
  // Firebase fields
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Local DB fields (populated after sync)
  dbId?: string;
  role?: string;
  authProvider?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        // Sync to backend
        try {
          const { data } = await api.post('/auth/sync');
          authUser.dbId = data.user.id;
          authUser.role = data.user.role;
          authUser.authProvider = data.user.authProvider;
        } catch (err) {
          console.error('Failed to sync user with backend:', err);
        }

        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
