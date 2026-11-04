import VnicsPage from "@/components/vnics/VnicsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/vnics/")({ component: VnicsPage });
