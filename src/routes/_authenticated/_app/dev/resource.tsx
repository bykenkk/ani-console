import { createFileRoute } from "@tanstack/react-router";
import ResourcePage from "@/components/dev/ResourcePage";

export const Route = createFileRoute("/_authenticated/_app/dev/resource")({
  component: ResourcePage,
});
