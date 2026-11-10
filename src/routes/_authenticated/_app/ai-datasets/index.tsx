import { createFileRoute } from "@tanstack/react-router";
import DatasetsPage from "@/components/ai-datasets/DatasetsPage";

export const Route = createFileRoute("/_authenticated/_app/ai-datasets/")({
  component: DatasetsPage,
});
