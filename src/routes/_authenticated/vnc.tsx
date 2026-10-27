import { createFileRoute, notFound } from "@tanstack/react-router";
import InstanceVncPage from "@/components/instances/InstanceVncPage";
import { validateInstanceRemoteSearch } from "@/lib/instances";

export const Route = createFileRoute("/_authenticated/vnc")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...validateInstanceRemoteSearch(search),
    kind: search.kind === "vm" ? ("vm" as const) : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (!search.instanceId) throw notFound();
  },
  component: function InstanceVncRoute() {
    const { instanceId, kind } = Route.useSearch();
    return <InstanceVncPage instanceId={instanceId} kind={kind} />;
  },
});
