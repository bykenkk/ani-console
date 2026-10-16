import SubnetsPage from "@/components/network/SubnetsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/subnets/")({
  component: SubnetsPage,
});
