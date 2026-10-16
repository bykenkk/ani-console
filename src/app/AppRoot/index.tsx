import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { showNotification } from "@/lib/feedback";
import { migrateLegacyAuthStorage } from "@/lib/storage";
import { useAuthStore } from "@/stores/auth";
import { queryClient } from "../query-client";
import { router } from "../router";

let authStartup: Promise<void> | undefined;

async function initializeAuth(): Promise<void> {
  try {
    await migrateLegacyAuthStorage();
  } catch {
    // Hydration can still continue when legacy migration is unavailable.
  }
  await useAuthStore.persist.rehydrate();
}

export function AppRoot() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return useAuthStore.subscribe((state, previous) => {
      if (!previous.tokens?.access_token || state.tokens?.access_token) return;

      // Clearing the session re-runs the parent auth guard, including on full-screen routes.
      router.invalidate().catch((error: unknown) => {
        showNotification({
          id: "auth-session",
          state: "error",
          action: "更新登录状态",
          content: { error, fallback: "请刷新页面后重试" },
        });
      });
    });
  }, []);

  useEffect(() => {
    let active = true;
    const ready = () => {
      if (!active) return;
      useAuthStore.setState({ hydrated: true });
      setAuthReady(true);
    };
    authStartup ??= initializeAuth();
    authStartup.then(ready, ready);
    return () => {
      active = false;
    };
  }, []);

  if (!authReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
