import FilesystemsPage from "@/components/storage/FilesystemsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/filesystems/")({
  component: FilesystemsPage,
});
