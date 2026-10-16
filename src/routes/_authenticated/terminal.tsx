import { createFileRoute, notFound } from "@tanstack/react-router";
import InstanceTerminalPage from "@/components/instances/InstanceTerminalPage";
import { validateInstanceRemoteSearch } from "@/lib/instances";

export const Route = createFileRoute("/_authenticated/terminal")({
  validateSearch: validateInstanceRemoteSearch,
  beforeLoad: ({ search }) => {
    if (!search.instanceId) throw notFound();
  },
  component: function InstanceTerminalRoute() {
    const { instanceId } = Route.useSearch();
    return <InstanceTerminalPage instanceId={instanceId} />;
  },
});
