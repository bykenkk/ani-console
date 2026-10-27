import type { ListPagination } from "@/components/common/DataTable";
import type { RowAction } from "@/components/common";
import {
  Breadcrumb,
  Button,
  Space,
  Tag,
  Typography,
  type TableColumnProps,
} from "@arco-design/web-react";
import { IconArrowLeft, IconFile, IconFolder, IconRefresh } from "@arco-design/web-react/icon";
import type { ReactNode } from "react";
import clsx from "clsx";
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
};

type ObjectBrowserProps = {
  bucketName: string;
  prefix: string;
  entries: ObjectBrowserEntry[];
  pagination: ListPagination;
  aclLabel: string;
  loading?: boolean;
  actions: RowAction<ObjectBrowserEntry>[];
  primaryAction?: ReactNode;
  rootPrefix?: string;
  readOnly?: boolean;
  onOpenObject?: (entry: ObjectBrowserEntry) => void;
  onRefresh?: () => void;
  onNavigate: (prefix: string) => void;
  onCreateFolder: () => void;
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
  bucketName,
  prefix,
  entries,
  pagination,
  aclLabel,
  loading,
  actions,
  primaryAction,
  rootPrefix = "/",
  readOnly = false,
  onOpenObject,
  onRefresh,
  onNavigate,
  onCreateFolder,
}: ObjectBrowserProps) {
  const segments = prefixSegments(prefix, rootPrefix);
  const canGoUp = prefix !== rootPrefix;
  const columns: Array<TableColumnProps<ObjectBrowserEntry>> = [
    {
      title: "名称",
      width: 200,
      render: (_, entry) => {
        const canNavigate = entry.kind === "prefix" || Boolean(onOpenObject);
        const target = entry.key;

        return (
          <button
            type="button"
            className={clsx(
              "inline-flex min-w-0 items-center gap-2.5 border-0 bg-transparent p-0 text-left text-app-text [font:inherit]!",
              canNavigate &&
                "cursor-pointer focus-visible:outline-2! focus-visible:outline-solid! focus-visible:outline-app-primary! focus-visible:outline-offset-3 [&:hover>span]:text-app-primary",
            )}
            onClick={
              entry.kind === "prefix" ? () => onNavigate(target) : () => onOpenObject?.(entry)
            }
            aria-label={entry.kind === "prefix" ? `进入文件夹 ${entry.name}` : `查看 ${entry.name}`}
          >
            {entry.kind === "prefix" ? (
              <IconFolder className={styles.folderIcon} />
            ) : (
              <IconFile className={styles.fileIcon} />
            )}
            <span className="truncate">{entry.name}</span>
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
      <div className="mb-3 flex items-center justify-between gap-4">
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item>
            <Button type="text" size="mini" onClick={() => onNavigate(rootPrefix)}>
              {bucketName}
            </Button>
          </Breadcrumb.Item>
          {segments.map(({ label, target }) => {
            return (
              <Breadcrumb.Item key={target}>
                <Button type="text" size="mini" onClick={() => onNavigate(target)}>
                  {label}
                </Button>
              </Breadcrumb.Item>
            );
          })}
        </Breadcrumb>
        <Space>
          {canGoUp ? (
            <Button
              icon={<IconArrowLeft />}
              onClick={() => onNavigate(parentPrefix(prefix, rootPrefix))}
            >
              返回上一级
            </Button>
          ) : null}
          <Typography.Text type="secondary">当前路径：{prefix || "/"}</Typography.Text>
          <Tag>{aclLabel}</Tag>
          {onRefresh ? (
            <Button icon={<IconRefresh />} loading={loading} onClick={onRefresh}>
              刷新
            </Button>
          ) : null}
          <Button
            onClick={onCreateFolder}
            disabled={readOnly}
            title={readOnly ? "暂未支持" : undefined}
          >
            新建文件夹
          </Button>
          {primaryAction}
        </Space>
      </div>

      <DataTable<ObjectBrowserEntry>
        className={styles.table}
        tableLabel="文件"
        rowKey={(entry) => `${entry.kind}:${entry.key}`}
        columns={columns}
        data={entries}
        loading={loading}
        pagination={pagination}
        scroll={{ x: "max-content" }}
        rowActions={actions}
      />
    </div>
  );
}
