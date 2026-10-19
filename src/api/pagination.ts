import type { PageParams } from "./types";

/** 临时将前 100 项作为选项集合，保留筛选参数、signal 和原始响应。
 * TODO(options-loading): 超过 100 项的选项暂不可见；后续按后端完整选项契约优化，移除此固定分页策略。
 */
export function withFirst100<TParams extends PageParams, TResult>(
  request: (params: TParams, signal?: AbortSignal) => Promise<TResult>,
) {
  return (params: Omit<TParams, keyof PageParams>, signal?: AbortSignal) =>
    request({ ...params, page: 1, pageSize: 100 } as TParams, signal);
}
