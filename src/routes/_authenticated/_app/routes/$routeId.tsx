import NetworkRouteDetailPage from "@/components/routes/NetworkRouteDetailPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/routes/$routeId")({
  component: function NetworkRouteDetailRoute() {
    const { routeId } = Route.useParams();
    return <NetworkRouteDetailPage routeId={routeId} />;
  },
});
