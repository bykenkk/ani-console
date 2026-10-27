import ObjectDetailPage from "@/components/objects/ObjectDetailPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/objects/$bucketId/$objectId")({
  validateSearch: (search: Record<string, unknown>): { key?: string } => ({
    key: typeof search.key === "string" ? search.key : undefined,
  }),
  component: function ObjectDetailRoute() {
    const { bucketId, objectId } = Route.useParams();
    const { key } = Route.useSearch();
    return <ObjectDetailPage bucketId={bucketId} objectId={key ?? objectId} />;
  },
});
