import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { migrateLegacyAuthStorage } from "@/lib/storage";
import { useAuthStore } from "@/stores/auth";
import { startAuthSession } from "@/api/request";
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
  await startAuthSession();
}

export function AppRoot() {
  const [authReady, setAuthReady] = useState(false);

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
