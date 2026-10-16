import { createFileRoute } from "@tanstack/react-router";
import VmsPage from "@/components/vms/VmsPage";

export const Route = createFileRoute("/_authenticated/_app/vms/")({
  component: VmsPage,
});
