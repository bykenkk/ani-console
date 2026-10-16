import VpcsPage from "@/components/network/VpcsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/vpcs/")({
  component: VpcsPage,
});
