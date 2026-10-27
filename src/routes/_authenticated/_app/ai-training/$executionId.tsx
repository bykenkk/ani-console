import { createFileRoute, useNavigate } from "@tanstack/react-router";
import TrainingTaskDetailPage from "@/components/ai-training/TrainingTaskDetailPage";

export const Route = createFileRoute("/_authenticated/_app/ai-training/$executionId")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab:
      search.tab === "logs" || search.tab === "artifacts" || search.tab === "snapshot"
        ? search.tab
        : undefined,
  }),
  component: function TrainingTaskDetailRoute() {
    const { executionId } = Route.useParams();
    const { tab } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    return (
      <TrainingTaskDetailPage
        executionId={executionId}
        tab={tab}
        onTabChange={(nextTab) => navigate({ search: { tab: nextTab }, replace: true })}
        onBack={() => navigate({ to: "/ai-training" })}
      />
    );
  },
});
