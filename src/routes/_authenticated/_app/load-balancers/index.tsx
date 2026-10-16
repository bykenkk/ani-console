import LoadBalancersPage from "@/components/network/LoadBalancersPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/load-balancers/")({
  component: LoadBalancersPage,
});
