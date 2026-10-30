import { useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { QueryErrorNotificationMeta } from "@/vite-env";
import type { ListPagination } from "@/components/common/DataTable";

export type CursorPage<T> = { items: T[]; total?: number | string; next_cursor?: string | null };
type UseCursorPaginatedQueryOptions<T> = {
  queryKey: readonly unknown[];
  queryFn: (
    input: { cursor?: string; limit: number },
    signal: AbortSignal,
  ) => Promise<CursorPage<T>>;
  initialPageSize?: number;
  enabled?: boolean;
  errorNotification?: QueryErrorNotificationMeta;
  refetchInterval?: UseQueryOptions<CursorPage<T>>["refetchInterval"];
};

// TODO(pagination-migration): 后端迁至 page/pageSize 后移除此游标兼容 Hook，改用正常服务端页码分页。
export function useCursorPaginatedQuery<T>({
  queryKey,
  queryFn,
  initialPageSize = 10,
  enabled = true,
  errorNotification,
  refetchInterval,
}: UseCursorPaginatedQueryOptions<T>) {
  const queryClient = useQueryClient();
  const scope = JSON.stringify(queryKey);
  const [window, setWindow] = useState({
    scope,
    page: 1,
    pageSize: initialPageSize,
    cursors: [undefined] as (string | undefined)[],
  });
  const current =
    window.scope === scope ? window : { ...window, scope, page: 1, cursors: [undefined] };
  if (window.scope !== scope) setWindow(current);
  const { page, pageSize, cursors } = current;
  const cursor = cursors[page - 1];
  const resetPagination = useCallback(() => {
    setWindow((value) => ({ ...value, page: 1, cursors: [undefined] }));
  }, []);
  const setPageSize = (size: number) => {
    setWindow({ ...current, page: 1, pageSize: size, cursors: [undefined] });
  };
  const query = useQuery({
    queryKey: [...queryKey, { cursor, limit: pageSize }],
    enabled,
    meta: { errorNotification },
    queryFn: ({ signal }) => queryFn({ cursor, limit: pageSize }, signal),
    refetchInterval,
  });
  // A deletion can empty the last page. Fetch the previous page instead of trapping the user.
  useEffect(() => {
    if (query.isSuccess && !query.isFetching && !query.data.items.length && page > 1) {
      setWindow((value) => ({ ...value, page: value.page - 1 }));
    }
  }, [query.isSuccess, query.isFetching, query.data, page]);
  const { refetch } = query;
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey, refetchType: "none" });
    resetPagination();
    if (page === 1) refetch();
  }, [page, refetch, resetPagination, queryClient, queryKey]);
  const pagination: ListPagination = {
    mode: "legacy-cursor",
    page,
    pageSize,
    hasNextPage: Boolean(query.data?.next_cursor),
    disabled: !enabled || query.isFetching,
    onPageChange: (nextPage) => {
      if (!enabled || query.isFetching) return;
      if (nextPage === page - 1 && page > 1) {
        setWindow({ ...current, page: nextPage });
        return;
      }
      const nextCursor = query.data?.next_cursor;
      if (nextPage === page + 1 && nextCursor) {
        setWindow({ ...current, page: nextPage, cursors: [...cursors.slice(0, page), nextCursor] });
      }
    },
    onPageSizeChange: setPageSize,
  };
  return { query, items: query.data?.items ?? [], pagination, resetPagination, refresh };
}
