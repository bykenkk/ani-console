import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SandboxDetailPage from "@/components/sandboxes/SandboxDetailPage";

export const Route = createFileRoute("/_authenticated/_app/sandboxes/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function SandboxDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    return (
      <SandboxDetailPage
        instanceId={instanceId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({ search: (current) => ({ ...current, tab: nextTab }), replace: true })
        }
      />
    );
  },
});
