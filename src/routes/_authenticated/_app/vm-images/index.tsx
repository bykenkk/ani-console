import VmImagesPage from "@/components/vm-images/VmImagesPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/vm-images/")({
  component: VmImagesPage,
});
