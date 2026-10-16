import { createFileRoute } from "@tanstack/react-router";
import TrainingTasksPage from "@/components/ai-training/TrainingTasksPage";
export const Route = createFileRoute("/_authenticated/_app/ai-training/")({
  component: TrainingTasksPage,
});
