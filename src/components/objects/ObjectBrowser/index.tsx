import type { ListPagination } from "@/components/common/DataTable";
import type { RowAction } from "@/components/common";
import { Button, type TableColumnProps } from "@arco-design/web-react";
import { IconFile, IconFolder, IconHome, IconRefresh } from "@arco-design/web-react/icon";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { DataTable } from "@/components/common";
import { formatBytes, formatDateTime } from "@/lib/format";
import styles from "./index.module.css";

export type ObjectBrowserEntry = {
  kind: "object" | "prefix";
  key: string;
  name: string;
  size_bytes?: number | string | null;
  updated_at?: string | null;
  storage_class?: string | null;
  etag?: string;
  isParent?: boolean;
};

type ObjectBrowserProps = {
  prefix: string;
  entries: ObjectBrowserEntry[];
  pagination: ListPagination;
  loading?: boolean;
  actions: RowAction<ObjectBrowserEntry>[];
  primaryAction?: ReactNode;
  rootPrefix?: string;
  onRefresh?: () => void;
  onNavigate: (prefix: string) => void;
};

function prefixSegments(prefix: string, rootPrefix: string) {
  const segments: { label: string; target: string }[] = [];
  let start = rootPrefix.length;
  for (let end = prefix.indexOf("/", start); end !== -1; end = prefix.indexOf("/", start)) {
    segments.push({ label: prefix.slice(start, end) || "/", target: prefix.slice(0, end + 1) });
    start = end + 1;
  }
  return segments;
}

function parentPrefix(prefix: string, rootPrefix: string): string {
  const segments = prefixSegments(prefix, rootPrefix);
  return segments.at(-2)?.target ?? rootPrefix;
}

export default function ObjectBrowser({
  prefix,
  entries,
  pagination,
  loading,
  actions,
  primaryAction,
  rootPrefix = "/",
  onRefresh,
  onNavigate,
}: ObjectBrowserProps) {
  const pathRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (pathRef.current) pathRef.current.scrollLeft = pathRef.current.scrollWidth;
  }, [prefix]);
  const canGoUp = prefix !== rootPrefix;
  // 导航行不属于服务端资源，不参与分页计数，也不提供资源操作。
  const rows: ObjectBrowserEntry[] = canGoUp
    ? [
        { kind: "prefix", key: parentPrefix(prefix, rootPrefix), name: "..", isParent: true },
        ...entries,
      ]
    : entries;
  const rowActions = actions.map((action) => ({
    ...action,
    visible: (entry: ObjectBrowserEntry) => !entry.isParent && action.visible?.(entry) !== false,
  }));
  const columns: Array<TableColumnProps<ObjectBrowserEntry>> = [
    {
      title: "名称",
      width: 200,
      ellipsis: true,
      render: (_, entry) => {
        const target = entry.key;
        if (entry.kind === "object")
          return (
            <span className="inline-flex min-w-0 items-center gap-2.5">
              <IconFile className={styles.fileIcon} />
              <span>{entry.name}</span>
            </span>
          );

        return (
          <button
            type="button"
            className="inline-flex min-w-0 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left text-app-text [font:inherit]! focus-visible:outline-2! focus-visible:outline-solid! focus-visible:outline-app-primary! focus-visible:outline-offset-3 [&:hover>span]:text-app-primary"
            onClick={() => onNavigate(target)}
            aria-label={entry.isParent ? "返回上一级" : `进入文件夹 ${entry.name}`}
          >
            <IconFolder className={styles.folderIcon} />
            <span>{entry.name}</span>
          </button>
        );
      },
    },
    {
      title: "大小",
      width: 100,
      render: (_, entry) =>
        entry.size_bytes != null ? formatBytes(Number(entry.size_bytes)) : "-",
    },
    {
      title: "更新时间",
      width: 180,
      render: (_, entry) => (entry.updated_at ? formatDateTime(entry.updated_at) : "-"),
    },
    { title: "ETag", dataIndex: "etag", width: 280, ellipsis: true },
    {
      title: "存储类型",
      width: 100,
      render: (_, entry) =>
        entry.kind === "object"
          ? entry.storage_class === "infrequent_access"
            ? "低频"
            : entry.storage_class === "standard"
              ? "标准"
              : "-"
          : "-",
    },
  ];

  return (
    <div className="min-w-0">
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <Button
          type="text"
          icon={<IconHome />}
          aria-label="返回根目录"
          title="返回根目录"
          onClick={() => onNavigate(rootPrefix)}
          className="shrink-0"
        />
        <div
          ref={pathRef}
          className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-app-text-secondary"
        >
          {prefix || "/"}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {primaryAction}
          {onRefresh ? (
            <Button
              icon={<IconRefresh />}
              loading={loading}
              onClick={onRefresh}
              aria-label="刷新"
              title="刷新"
            />
          ) : null}
        </div>
      </div>

      <DataTable<ObjectBrowserEntry>
        className={styles.table}
        tableLabel="文件"
        rowKey={(entry) => (entry.isParent ? "parent-navigation" : `${entry.kind}:${entry.key}`)}
        columns={columns}
        data={rows}
        loading={loading}
        pagination={pagination}
        scroll={{ x: "max-content" }}
        rowActions={rowActions}
      />
    </div>
  );
}
