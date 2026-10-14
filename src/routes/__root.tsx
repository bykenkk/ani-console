import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { NotFoundPage } from "@/components/common";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: function RootComponent() {
    return <Outlet />;
  },
  notFoundComponent: NotFoundPage,
});
