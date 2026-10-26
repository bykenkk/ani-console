import EipsPage from "@/components/network/EipsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/eips/")({ component: EipsPage });
