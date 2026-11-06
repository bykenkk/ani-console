import ContainerImagesPage from "@/components/container-images/ContainerImagesPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/container-images/")({
  component: ContainerImagesPage,
});
