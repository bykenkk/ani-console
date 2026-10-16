import GpuInstanceTerminalPage from "@/components/instances/GpuInstanceTerminalPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gpu-instances/$instanceId/terminal")({
  component: function GpuInstanceTerminalRoute() {
    const { instanceId } = Route.useParams();
    return <GpuInstanceTerminalPage instanceId={instanceId} />;
  },
});
