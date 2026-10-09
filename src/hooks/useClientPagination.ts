import { useEffect } from "react";
import type { ListPagination } from "@/components/common/DataTable";
import { useListPagination } from "./useListPagination";

/** Temporary local paging, also usable for collections composed from multiple queries. */
export function useClientPagination<T>(items: T[], scope: string, initialPageSize = 10) {
  const { page, pageSize, setPage, setPageSize, resetPagination } = useListPagination(
    scope,
    initialPageSize,
  );
  const total = items.length;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage, setPage]);
  const pagination: ListPagination = {
    mode: "total",
    page: currentPage,
    pageSize,
    total,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  };
  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    pagination,
    resetPagination,
  };
}
