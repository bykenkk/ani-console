import { create } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { createJSONStorage, persist } from "zustand/middleware";

import { authStorage } from "@/lib/storage";

export interface AuthTokens {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  issued_at?: string;
}

export interface AuthSession {
  tokens: AuthTokens;
  username: string | null;
}

interface AuthState {
  tokens: AuthTokens | null;
  username: string | null;
  hasKnownUsername: boolean;
  hydrated: boolean;
  setAuthSession: (session: AuthSession | null) => void;
  clear: () => void;
  getAccessToken: () => string | null;
  getAccessTokenJti: () => string | null;
  setHydrated: (hydrated: boolean) => void;
}

const authStateStorage: StateStorage = {
  async getItem(name) {
    try {
      return await authStorage.getItem<string>(name);
    } catch {
      return null;
    }
  },
  async setItem(name, value) {
    try {
      await authStorage.setItem(name, value);
    } catch {
      // Authentication remains usable for the lifetime of the page.
    }
  },
  async removeItem(name) {
    try {
      await authStorage.removeItem(name);
    } catch {
      // The in-memory Zustand state has still been cleared.
    }
  },
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtJti(token: string): string | null {
  const payload = decodeJwtPayload(token);
  return typeof payload?.jti === "string" && payload.jti ? payload.jti : null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      username: null,
      hasKnownUsername: false,
      hydrated: false,
      setAuthSession: (session) => {
        const username = session?.username?.trim() || null;
        set({
          tokens: session
            ? {
                access_token: session.tokens.access_token,
                expires_in: session.tokens.expires_in,
                issued_at: session.tokens.issued_at,
                token_type: session.tokens.token_type,
              }
            : null,
          username,
          hasKnownUsername: username !== null,
        });
      },
      clear: () =>
        set({
          tokens: null,
          username: null,
          hasKnownUsername: false,
        }),
      getAccessToken: () => get().tokens?.access_token ?? null,
      getAccessTokenJti: () => {
        const token = get().tokens?.access_token;
        return token ? getJwtJti(token) : null;
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "ani-console-auth",
      storage: createJSONStorage(() => authStateStorage),
      partialize: (state) => ({
        username: state.username,
        hasKnownUsername: state.hasKnownUsername,
      }),
      // Restore only display metadata; discard old tokens and removed authentication flags.
      merge: (persisted, current) => {
        const saved = persisted as { username?: unknown } | undefined;
        const username = typeof saved?.username === "string" ? saved.username.trim() || null : null;
        return { ...current, username, hasKnownUsername: username !== null, tokens: null };
      },
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);

export function isAuthHydrated(): boolean {
  return useAuthStore.getState().hydrated;
}

export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().tokens?.access_token;
}
