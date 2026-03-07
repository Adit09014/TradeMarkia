"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserColor } from "@/lib/userColors";

interface AuthUser {
  uid: string;
  name: string;
  color: string;
  firebaseUser: User;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Anonymous",
          color: getUserColor(firebaseUser.uid),
          firebaseUser,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithName = async (name: string) => {
    await signInWithPopup(auth, googleProvider);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser((prev) =>
        prev ? { ...prev, name } : null
      );
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return(
    <AuthContext.Provider value={{user,loading,signInWithGoogle,signInWithName,logout}}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

