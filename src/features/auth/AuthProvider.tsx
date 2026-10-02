"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { onSessionChange, refreshSession } from "@/services/api/session";
import { tokenStore } from "@/services/api/token-store";
import { authService } from "@/services/auth/auth.service";
import type { AuthPayload, LoginInput, RegisterInput, User } from "@/services/auth/types";

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  /** Adopt a session obtained elsewhere (e.g. OTP login). */
  startSession: (payload: AuthPayload) => void;
  logout: (everywhere?: boolean) => Promise<void>;
  setUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type TabMessage = { type: "login" } | { type: "logout" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const channel = useRef<BroadcastChannel | null>(null);

  const applySession = useCallback((payload: AuthPayload | null) => {
    setUserState(payload?.user ?? null);
    setStatus(payload ? "authenticated" : "guest");
  }, []);

  const clearLocalSession = useCallback(() => {
    tokenStore.clear();
    queryClient.clear(); // drop cached private data
    applySession(null);
  }, [applySession, queryClient]);

  // Restore the session from the refresh cookie and keep in sync with other tabs.
  useEffect(() => {
    const unsubscribe = onSessionChange(applySession);
    void refreshSession().then((payload) => applySession(payload));

    channel.current = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("gk-auth") : null;
    channel.current?.addEventListener("message", (event: MessageEvent<TabMessage>) => {
      if (event.data.type === "logout") clearLocalSession();
      if (event.data.type === "login") void refreshSession();
    });

    return () => {
      unsubscribe();
      channel.current?.close();
    };
  }, [applySession, clearLocalSession]);

  const startSession = useCallback(
    (payload: AuthPayload) => {
      tokenStore.set(payload.access_token);
      applySession(payload);
      channel.current?.postMessage({ type: "login" } satisfies TabMessage);
    },
    [applySession],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await authService.login(input);
      startSession(data);
      return data.user;
    },
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { data } = await authService.register(input);
      startSession(data);
      return data.user;
    },
    [startSession],
  );

  const logout = useCallback(
    async (everywhere = false) => {
      try {
        await (everywhere ? authService.logoutAll() : authService.logout());
      } finally {
        clearLocalSession();
        channel.current?.postMessage({ type: "logout" } satisfies TabMessage);
      }
    },
    [clearLocalSession],
  );

  const setUser = useCallback((next: User) => setUserState(next), []);

  const hasPermission = useCallback((permission: string) => user?.permissions.includes(permission) ?? false, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, startSession, logout, setUser, hasPermission }),
    [status, user, login, register, startSession, logout, setUser, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
