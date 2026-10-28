import { createFileRoute } from "@tanstack/react-router";
import ModelApiKeysPage from "@/components/ai-api-keys/ModelApiKeysPage";

export const Route = createFileRoute("/_authenticated/_app/ai-api-keys/")({
  component: ModelApiKeysPage,
});
