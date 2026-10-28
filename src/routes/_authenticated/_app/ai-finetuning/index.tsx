import { createFileRoute } from "@tanstack/react-router";
import FineTuningTasksPage from "@/components/ai-finetuning/FineTuningTasksPage";

export const Route = createFileRoute("/_authenticated/_app/ai-finetuning/")({
  component: FineTuningTasksPage,
});
