import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/dev/")({
  beforeLoad: () => {
    throw redirect({ to: "/dev/resource", replace: true });
  },
});
