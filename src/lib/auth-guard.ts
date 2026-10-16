import { redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/stores/auth";

export function requireAuth({ location }: { location: { href: string } }): void {
  if (!isAuthenticated()) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
      replace: true,
    });
  }
}
