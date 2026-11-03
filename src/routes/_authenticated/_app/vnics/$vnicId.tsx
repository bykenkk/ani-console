import VnicDetailPage from "@/components/vnics/VnicDetailPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/vnics/$vnicId")({
  component: function VnicDetailRoute() {
    const { vnicId } = Route.useParams();
    return <VnicDetailPage vnicId={vnicId} />;
  },
});
