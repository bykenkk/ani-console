import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import VmDetailPage from "@/components/vms/VmDetailPage";

export const Route = createFileRoute("/_authenticated/_app/vms/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function VmDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const pathname = useRouterState({
      select: (state) => state.location.pathname,
    });
    if (pathname !== `/vms/${instanceId}`) return <Outlet />;
    return (
      <VmDetailPage
        instanceId={instanceId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({ search: (current) => ({ ...current, tab: nextTab }), replace: true })
        }
      />
    );
  },
});
