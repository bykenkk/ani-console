import VolumesPage from "@/components/storage/VolumesPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/volumes/")({
  component: VolumesPage,
});
