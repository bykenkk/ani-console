import { ApiKeysPage } from "@/components/security/ApiKeysPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/api-keys/")({
  component: ApiKeysPage,
});
