import { useCallback, useState } from "react";

/** Shared page state for server pagination and temporary client pagination. */
export function useListPagination(scope: string, initialPageSize: number) {
  const [state, setState] = useState({ scope, page: 1, pageSize: initialPageSize });
  const page = state.scope === scope ? state.page : 1;
  if (state.scope !== scope) setState({ ...state, scope, page: 1 });
  const resetPagination = useCallback(() => {
    setState((current) => ({ ...current, page: 1 }));
  }, []);
  const setPage = useCallback((page: number) => {
    setState((current) => ({ ...current, page: Math.max(1, page) }));
  }, []);
  const setPageSize = useCallback((pageSize: number) => {
    setState((current) => ({ ...current, page: 1, pageSize }));
  }, []);
  return { page, pageSize: state.pageSize, setPage, setPageSize, resetPagination };
}
