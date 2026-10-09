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
import { IconArrowLeft, IconFile, IconFolder } from "@arco-design/web-react/icon";
import type { ReactNode } from "react";
import type { StorageBucketObjectEntry } from "@/api/storage/buckets";
import { DataTable } from "@/components/common";
import { formatBytes, formatDateTime } from "@/lib/format";
import styles from "./index.module.css";

type BucketEntry = StorageBucketObjectEntry;

type ObjectBrowserProps = {
  bucketName: string;
  prefix: string;
  entries: BucketEntry[];
  pagination: ListPagination;
  aclLabel: string;
  loading?: boolean;
  actions: RowAction<BucketEntry>[];
  primaryAction?: ReactNode;
  onNavigate: (prefix: string) => void;
  onCreateFolder: () => void;
};

function prefixSegments(prefix: string): string[] {
  return prefix.split("/").filter(Boolean);
}

function parentPrefix(prefix: string): string {
  const segments = prefixSegments(prefix);
  if (segments.length <= 1) return "/";
  return `/${segments.slice(0, -1).join("/")}/`;
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
  onNavigate,
  onCreateFolder,
}: ObjectBrowserProps) {
  const segments = prefixSegments(prefix);
  const canGoUp = prefix !== "/";
  const columns: Array<TableColumnProps<BucketEntry>> = [
    {
      title: "名称",
      render: (_, entry) => {
        const canNavigate = entry.kind === "prefix";
        const target = entry.key;

        return (
          <button
            type="button"
            className={canNavigate ? styles.entryButton : styles.entryLabel}
            onClick={canNavigate ? () => onNavigate(target) : undefined}
            aria-label={canNavigate ? `进入文件夹 ${entry.name}` : undefined}
          >
            {entry.kind === "prefix" ? (
              <IconFolder className={styles.folderIcon} />
            ) : (
              <IconFile className={styles.fileIcon} />
            )}
            <span className={styles.entryName}>{entry.name}</span>
          </button>
        );
      },
    },
    {
      title: "大小",
      width: 100,
      render: (_, entry) => (entry.size_bytes != null ? formatBytes(entry.size_bytes) : "-"),
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
            : "标准"
          : "-",
    },
  ];

  return (
    <div className={styles.browser}>
      <div className={styles.toolbar}>
        <Breadcrumb className={styles.breadcrumb}>
          <Breadcrumb.Item>
            <Button type="text" size="mini" onClick={() => onNavigate("/")}>
              {bucketName}
            </Button>
          </Breadcrumb.Item>
          {segments.map((segment, index) => {
            const target = `/${segments.slice(0, index + 1).join("/")}/`;
            return (
              <Breadcrumb.Item key={target}>
                <Button type="text" size="mini" onClick={() => onNavigate(target)}>
                  {segment}
                </Button>
              </Breadcrumb.Item>
            );
          })}
        </Breadcrumb>
        <Space>
          {canGoUp ? (
            <Button icon={<IconArrowLeft />} onClick={() => onNavigate(parentPrefix(prefix))}>
              返回上一级
            </Button>
          ) : null}
          <Typography.Text type="secondary">当前路径：{prefix}</Typography.Text>
          <Tag>{aclLabel}</Tag>
          <Button onClick={onCreateFolder}>新建文件夹</Button>
          {primaryAction}
        </Space>
      </div>

      <DataTable<BucketEntry>
        className={styles.table}
        tableLabel="文件"
        rowKey={(entry) => entry.key}
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
