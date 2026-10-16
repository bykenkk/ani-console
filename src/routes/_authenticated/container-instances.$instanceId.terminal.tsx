import ContainerInstanceTerminalPage from "@/components/instances/ContainerInstanceTerminalPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/container-instances/$instanceId/terminal")({
  component: function ContainerInstanceTerminalRoute() {
    const { instanceId } = Route.useParams();
    return <ContainerInstanceTerminalPage instanceId={instanceId} />;
  },
});
