import VolumesPage from "@/components/volumes/VolumesPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/volumes/")({
  component: VolumesPage,
});
