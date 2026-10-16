import GpuContainersPage from "@/components/gpu-containers/GpuContainersPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/gpu-containers/")({
  component: GpuContainersPage,
});
