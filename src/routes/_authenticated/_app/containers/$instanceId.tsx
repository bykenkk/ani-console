import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import ContainerDetailPage from "@/components/containers/ContainerDetailPage";

export const Route = createFileRoute("/_authenticated/_app/containers/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function ContainerDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    if (pathname !== `/containers/${instanceId}`) return null;
    return (
      <ContainerDetailPage
        instanceId={instanceId}
        tab={tab}
        onTabChange={(nextTab) =>
          navigate({
            search: (current) => ({ ...current, tab: nextTab }),
            replace: true,
          })
        }
      />
    );
  },
});
