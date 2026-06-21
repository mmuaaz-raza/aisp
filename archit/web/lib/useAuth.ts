"use client";

import { useEffect, useState, useCallback } from "react";

// Relative path — proxied to http://localhost:8000 via next.config.ts rewrites.
// This keeps all requests same-origin so browser cookies are sent automatically.
const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const BACKEND = `${BACKEND_URL}/api/v1`;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  isLoggedIn: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount, check if server cookie session is valid
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/auth`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const usr: AuthUser = data.user ?? {
            id: data.id ?? data.user_id ?? "",
            name: data.name ?? data.username ?? "",
            email: data.email ?? "",
          };
          setUser(usr);
        }
        // Non-2xx (401, 403) just means not logged in — no user set, that's fine
      } catch (e) {
        // Only a network/CORS failure reaches here — safe to ignore but log for debugging
        console.warn("[useAuth] /auth check failed:", e);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Send as both `email` and `name` so the backend can match whichever field it uses
      const body = { name: emailOrUsername, password };

      const res = await fetch(`${BACKEND}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail ?? errData?.message ?? "Invalid credentials");
      }

      const data = await res.json();
      const usr: AuthUser = data.user ?? {
        id: data.id ?? data.user_id ?? "",
        name: data.name ?? data.username ?? emailOrUsername,
        email: data.email ?? emailOrUsername,
      };
      setUser(usr);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.detail ?? errData?.message ?? "Registration failed");
        }

        const data = await res.json();
        const usr: AuthUser = data.user ?? {
          id: data.id ?? data.user_id ?? "",
          name: data.name ?? name,
          email: data.email ?? email,
        };
        setUser(usr);
        return true;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Registration failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${BACKEND}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    loading,
    initializing,
    error,
    isLoggedIn: !!user,
    login,
    register,
    logout,
    clearError,
  };
}
