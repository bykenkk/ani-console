import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { QueryErrorNotificationMeta } from "@/vite-env";
import { useClientPagination } from "./useClientPagination";

type UseClientPaginatedQueryOptions<T> = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<{ items?: T[] }>;
  filter?: (item: T) => boolean;
  filterScope?: string;
  initialPageSize?: number;
  enabled?: boolean;
  errorNotification?: QueryErrorNotificationMeta;
};

/** 仅用于后端明确返回完整集合的接口，不用于对服务端当前页再次切片。
 * TODO(pagination-migration): 后端提供 page/pageSize 后逐项改为服务端分页，再移除此过渡 Hook。
 */
export function useClientPaginatedQuery<T>({
  queryKey,
  queryFn,
  filter,
  filterScope,
  initialPageSize = 10,
  enabled = true,
  errorNotification,
}: UseClientPaginatedQueryOptions<T>) {
  const query = useQuery({ queryKey, queryFn, enabled, meta: { errorNotification } });
  const allItems = query.data?.items ?? [];
  const filteredItems = filter ? allItems.filter(filter) : allItems;
  const { items, pagination, resetPagination } = useClientPagination(
    filteredItems,
    JSON.stringify([queryKey, filterScope]),
    initialPageSize,
  );
  const { refetch } = query;
  const refresh = useCallback(() => {
    resetPagination();
    refetch();
  }, [refetch, resetPagination]);
  return {
    query,
    items,
    pagination: { ...pagination, disabled: query.isFetching },
    resetPagination,
    refresh,
  };
}
