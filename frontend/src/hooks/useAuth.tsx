"use client";

import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { login as apiLogin, type User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("formfit_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("formfit_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const userData = await apiLogin(username);
      setUser(userData);
      localStorage.setItem("formfit_user", JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("formfit_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
