// TODO(pagination-migration): 仅供后端 cursor/limit 或 page_token 过渡期使用；接口全部迁至 page/pageSize 后移除此兼容组件和 legacy-cursor 配置。
import { Button, Select, Space } from "@arco-design/web-react";
import type { ListPagination } from "..";

type LegacyCursorPaginationProps = {
  pagination: Extract<ListPagination, { mode: "legacy-cursor" }>;
  tableLabel: string;
};

export default function LegacyCursorPagination({
  pagination,
  tableLabel,
}: LegacyCursorPaginationProps) {
  const { page, pageSize, disabled, hasNextPage, onPageChange, onPageSizeChange } = pagination;
  return (
    <nav aria-label={tableLabel + "分页"} className="mt-4 flex shrink-0 justify-end">
      <Space>
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
        <Button disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
          上一页
        </Button>
        <Button disabled={disabled || !hasNextPage} onClick={() => onPageChange(page + 1)}>
          下一页
        </Button>
      </Space>
    </nav>
  );
}
