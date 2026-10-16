import ObjectsPage from "@/components/storage/ObjectsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/objects/")({
  component: ObjectsPage,
});
