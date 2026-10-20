import { useEffect } from "react";
import type { ListPagination } from "@/components/common/DataTable";
import { useListPagination } from "./useListPagination";

/** 仅对已获取的完整集合做本地分页，不将服务端当前页当作全量。
 * TODO(pagination-migration): 远程列表提供 page/pageSize 后逐项迁移；真正的本地数组继续使用本地分页。
 */
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
