import SecurityGroupsPage from "@/components/security-groups/SecurityGroupsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/security-groups/")({
  component: SecurityGroupsPage,
});
