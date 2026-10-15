import { useQuery } from "@tanstack/react-query";
import { currentUserQueryKey, getCurrentUser } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.tokens?.access_token);

  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: ({ signal }) => getCurrentUser(signal),
    enabled: Boolean(accessToken),
    meta: {
      errorNotification: {
        id: "current-user",
        action: "当前用户信息加载",
        fallback: "当前用户信息加载失败",
      },
    },
  });
}
