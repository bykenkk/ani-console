import { createFileRoute, useNavigate } from "@tanstack/react-router";
import GpuContainerDetailPage from "@/components/gpu-containers/GpuContainerDetailPage";

export const Route = createFileRoute("/_authenticated/_app/gpu-containers/$instanceId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: function GpuContainerDetailRoute() {
    const { instanceId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });

    return (
      <GpuContainerDetailPage
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
