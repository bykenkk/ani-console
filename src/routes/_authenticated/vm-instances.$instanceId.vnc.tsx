import VmInstanceRemotePage from "@/components/instances/VmInstanceRemotePage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/vm-instances/$instanceId/vnc")({
  component: function VmInstanceRemoteRoute() {
    const { instanceId } = Route.useParams();
    return <VmInstanceRemotePage instanceId={instanceId} />;
  },
});
