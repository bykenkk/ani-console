import LoadBalancersPage from "@/components/load-balancers/LoadBalancersPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/load-balancers/")({
  component: LoadBalancersPage,
});
