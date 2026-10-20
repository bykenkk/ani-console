import FilesystemDetailPage from "@/components/filesystems/FilesystemDetailPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/filesystems/$filesystemId")({
  component: function FilesystemDetailRoute() {
    const { filesystemId } = Route.useParams();
    return <FilesystemDetailPage filesystemId={filesystemId} />;
  },
});
