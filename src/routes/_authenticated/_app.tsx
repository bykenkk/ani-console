import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";

export const Route = createFileRoute("/_authenticated/_app")({
  component: function AppRouteLayout() {
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    );
  },
});
