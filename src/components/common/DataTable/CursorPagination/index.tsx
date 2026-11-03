import { Button, Select } from "@arco-design/web-react";
import { IconLeft, IconRight } from "@arco-design/web-react/icon";
import type { ListPagination } from "..";

type CursorPaginationProps = {
  pagination: Extract<ListPagination, { mode: "legacy-cursor" }>;
  tableLabel: string;
};

/**
 * @deprecated 仅兼容后端 cursor/limit 或 page_token 分页，新接口使用 page/pageSize。
 * TODO(pagination-migration): 接口全部迁移后移除此组件和 legacy-cursor 配置。
 */
export default function CursorPagination({ pagination, tableLabel }: CursorPaginationProps) {
  const { page, pageSize, disabled, hasNextPage, onPageChange, onPageSizeChange } = pagination;
  return (
    <nav
      aria-label={tableLabel + "分页"}
      className="mt-4 flex shrink-0 items-center justify-end gap-2"
    >
      <Button
        type="text"
        icon={<IconLeft />}
        aria-label="上一页"
        title="上一页"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <Button
        type="text"
        icon={<IconRight />}
        aria-label="下一页"
        title="下一页"
        disabled={disabled || !hasNextPage}
        onClick={() => onPageChange(page + 1)}
      />
      <Select
        aria-label="每页条数"
        style={{ width: 110 }}
        value={pageSize}
        disabled={disabled}
        options={(pagination.pageSizeOptions ?? [10, 20, 50]).map((size) => ({
          value: size,
          label: size + " 条/页",
        }))}
        onChange={onPageSizeChange}
      />
    </nav>
  );
}
