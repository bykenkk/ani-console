import InferencePage from "@/components/ai-inference/InferencePage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/ai-inference/")({
  component: InferencePage,
});
