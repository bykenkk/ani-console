import { createFileRoute } from "@tanstack/react-router";
import InferencePolicyDetailPage from "@/components/ai-inference-policies/InferencePolicyDetailPage";

export const Route = createFileRoute("/_authenticated/_app/ai-inference-policies/$policyId")({
  component: function InferencePolicyDetailRoute() {
    const { policyId } = Route.useParams();
    return <InferencePolicyDetailPage key={policyId} policyId={policyId} />;
  },
});
