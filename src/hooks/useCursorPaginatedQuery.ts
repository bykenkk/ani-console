import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { QueryErrorNotificationMeta } from "@/vite-env";
import type { ListPagination } from "@/components/common/DataTable";
import { useListPagination } from "./useListPagination";

export type CursorPage<T> = { items: T[]; total?: number | string; next_cursor?: string | null };
type UseCursorPaginatedQueryOptions<T> = {
  queryKey: readonly unknown[];
  queryFn: (input: { cursor?: string; limit: number }) => Promise<CursorPage<T>>;
  initialPageSize?: number;
  enabled?: boolean;
  errorNotification?: QueryErrorNotificationMeta;
  refetchInterval?: (data: CursorPage<T> | undefined) => number | false;
};

export function useCursorPaginatedQuery<T>({
  queryKey,
  queryFn,
  initialPageSize = 10,
  enabled = true,
  errorNotification,
  refetchInterval,
}: UseCursorPaginatedQueryOptions<T>) {
  const queryClient = useQueryClient();
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination(
    JSON.stringify(queryKey),
    initialPageSize,
  );
  const cursor = page === 1 ? undefined : String((page - 1) * pageSize);
  const query = useQuery({
    queryKey: [...queryKey, { cursor, limit: pageSize }],
    enabled,
    meta: { errorNotification },
    queryFn: () => queryFn({ cursor, limit: pageSize }),
    refetchInterval: refetchInterval ? (query) => refetchInterval(query.state.data) : false,
  });
  // A deletion can empty the last page. Fetch the previous page instead of trapping the user.
  useEffect(() => {
    if (query.isSuccess && !query.isFetching && !query.data.items.length && page > 1) {
      setPage(page - 1);
    }
  }, [query.isSuccess, query.isFetching, query.data, page, setPage]);
  const { refetch } = query;
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey, refetchType: "none" });
    resetPagination();
    if (page === 1) refetch();
  }, [page, refetch, resetPagination, queryClient, queryKey]);
  const pagination: ListPagination = {
    mode: "cursor",
    page,
    pageSize,
    hasNextPage: Boolean(query.data?.next_cursor),
    disabled: query.isFetching,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  };
  return { query, items: query.data?.items ?? [], pagination, resetPagination, refresh };
}
