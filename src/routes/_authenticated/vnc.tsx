import { createFileRoute, notFound } from "@tanstack/react-router";
import InstanceVncPage from "@/components/instances/InstanceVncPage";
import { validateInstanceRemoteSearch } from "@/lib/instances";

export const Route = createFileRoute("/_authenticated/vnc")({
  validateSearch: validateInstanceRemoteSearch,
  beforeLoad: ({ search }) => {
    if (!search.instanceId) throw notFound();
  },
  component: function InstanceVncRoute() {
    const { instanceId } = Route.useSearch();
    return <InstanceVncPage instanceId={instanceId} />;
  },
});
