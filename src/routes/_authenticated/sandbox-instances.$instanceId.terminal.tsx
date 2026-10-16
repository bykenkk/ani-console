import SandboxInstanceTerminalPage from "@/components/instances/SandboxInstanceTerminalPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/sandbox-instances/$instanceId/terminal")({
  component: function SandboxInstanceTerminalRoute() {
    const { instanceId } = Route.useParams();
    return <SandboxInstanceTerminalPage instanceId={instanceId} />;
  },
});
