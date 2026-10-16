import ModelsPage from "@/components/ai-models/ModelsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/ai-models/")({
  component: ModelsPage,
});
