import NetworkRoutesPage from "@/components/network/NetworkRoutesPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/routes/")({
  component: NetworkRoutesPage,
});
