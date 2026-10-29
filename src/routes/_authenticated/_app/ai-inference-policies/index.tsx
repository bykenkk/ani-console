import { createFileRoute } from "@tanstack/react-router";
import InferencePoliciesPage from "@/components/ai-inference-policies/InferencePoliciesPage";

export const Route = createFileRoute("/_authenticated/_app/ai-inference-policies/")({
  component: InferencePoliciesPage,
});
