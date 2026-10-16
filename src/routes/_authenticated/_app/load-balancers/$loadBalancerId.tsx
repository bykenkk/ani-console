import LoadBalancerDetailPage from "@/components/load-balancers/LoadBalancerDetailPage";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/load-balancers/$loadBalancerId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function LoadBalancerDetailRoute() {
    const { loadBalancerId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    return (
      <LoadBalancerDetailPage
        loadBalancerId={loadBalancerId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({ search: (current) => ({ ...current, tab: nextTab }), replace: true })
        }
      />
    );
  },
});
