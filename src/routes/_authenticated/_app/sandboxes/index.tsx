import { createFileRoute } from "@tanstack/react-router";
import SandboxesPage from "@/components/sandboxes/SandboxesPage";

export const Route = createFileRoute("/_authenticated/_app/sandboxes/")({
  component: SandboxesPage,
});
