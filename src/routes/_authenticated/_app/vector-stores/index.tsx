import VectorStoresPage from "@/components/vector-stores/VectorStoresPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/vector-stores/")({
  component: VectorStoresPage,
});
