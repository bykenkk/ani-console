import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/request";
import { getConsoleOverview } from "@/api/overview";

export function useHomeOverview() {
  return useQuery({
    meta: {
      errorNotification: {
        id: "resource-summaries",
        action: "概览统计加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["governance-overview"],
    queryFn: ({ signal }) => getConsoleOverview(signal),
    staleTime: 60_000,
    refetchInterval: ({ state }) =>
      state.error instanceof ApiError && [400, 401, 403].includes(state.error.status ?? 0)
        ? false
        : 60_000,
    refetchIntervalInBackground: false,
  });
}
