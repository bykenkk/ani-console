import { createFileRoute } from "@tanstack/react-router";
import ContainerInstancesPage from "@/components/instances/ContainerInstancesPage";

export const Route = createFileRoute("/_authenticated/_app/container-instances/")({
  component: ContainerInstancesPage,
});
