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

/** Transitional pagination for endpoints returning the full collection.
 * Replace with useCursorPaginatedQuery when the endpoint gains server pagination.
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
