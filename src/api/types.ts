export interface CoreDevProfileInfo {
  mode: "local" | "real";
  provider: string;
  real_provider: boolean;
  reason?: string | null;
}

/** 页码分页参数。 */
export interface PageParams {
  page?: number;
  pageSize?: number;
}

/**
 * @deprecated 后端分页改造未完成时的临时过渡契约。新接入使用 PageParams。
 * TODO(pagination-migration): 后端支持 page/pageSize 后逐项迁移调用，再移除此类型；不直接替换现有请求参数。
 */
export interface CursorPageParams {
  limit?: number;
  /** 按对应后端契约原样传递；不得统一按页码或偏移量构造游标。 */
  cursor?: string;
}
