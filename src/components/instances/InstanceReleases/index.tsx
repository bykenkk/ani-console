// FIXME(governance-migration): 当前镜像 ID/摘要已可读取新详情，发布修订与历史仍保留旧字段，不以单次操作状态替代。
// TODO(governance-migration): 等发布历史契约齐备后迁移。
import { type InstanceRecord } from "@/api/instances/legacy";
import type { InstanceRecord as CurrentInstanceRecord } from "@/api/instances";
import type { RowAction } from "@/components/common";
import { Descriptions, Space, Tooltip, Typography } from "@arco-design/web-react";
import type { ReactNode } from "react";
import { DataTable, ImageNameText, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { getImageDisplayName } from "@/lib/render";

type InstanceReleasesProps = {
  instance?: Instance;
  currentImage?: Pick<CurrentInstanceRecord, "imageId" | "imageDigest">;
  loading?: boolean;
  actions?: ReactNode;
  versionLayout?: boolean;
  revisionActions?: RowAction<Release>[];
};

type Instance = InstanceRecord;
type Release = NonNullable<NonNullable<Instance["container"]>["history"]>[number];

export default function InstanceReleases({
  instance,
  currentImage,
  loading = false,
  actions,
  versionLayout = false,
  revisionActions,
}: InstanceReleasesProps) {
  const releases = instance?.container?.history ?? [];
  const rolloutLabels: Record<string, string> = {
    pending: "待发布",
    progressing: "发布中",
    healthy: "健康",
    degraded: "异常",
    rolled_back: "已回滚",
  };
  const rolloutStatus = instance?.container?.rollout_status;
  const currentRevision = instance?.container?.revision;
  const currentRelease = releases.find((release) => release.revision === currentRevision);

  if (versionLayout) {
    return (
      <Space direction="vertical" size={32} className="w-full">
        <section>
          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
            <Typography.Title heading={6} className="m-0!">
              当前镜像
            </Typography.Title>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
          <Descriptions
            column={1}
            labelStyle={{ width: "120px" }}
            data={[
              ...(currentImage
                ? [
                    { label: "镜像 ID", value: currentImage.imageId || "-" },
                    { label: "镜像摘要", value: currentImage.imageDigest || "-" },
                  ]
                : [{ label: "镜像", value: <ImageNameText image={instance?.image} /> }]),
              { label: "版本", value: currentRevision ?? "-" },
              {
                label: "更新时间",
                value: formatDateTime(currentRelease?.created_at ?? instance?.updated_at),
              },
            ]}
          />
        </section>

        <section>
          <DataTable<Release>
            header={{ title: "版本记录" }}
            data={releases}
            loading={loading}
            rowKey="revision"
            pagination={false}
            rowActions={revisionActions}
            columns={[
              {
                title: "版本",
                dataIndex: "revision",
                fixed: "left",
                width: 240,
                render: (revision) => (
                  <div className="flex min-w-0 items-center gap-2">
                    <Tooltip content={revision}>
                      <span className="block min-w-0 flex-1 truncate whitespace-nowrap">
                        {revision}
                      </span>
                    </Tooltip>
                    {revision === currentRevision ? (
                      <StatusBadge tone="primary" className="shrink-0">
                        当前
                      </StatusBadge>
                    ) : null}
                  </div>
                ),
              },
              {
                title: "镜像",
                width: 280,
                ellipsis: true,
                render: (_, release) => getImageDisplayName(release.image),
              },
              {
                title: "更新时间",
                width: 180,
                render: (_, release) => formatDateTime(release.created_at),
              },
            ]}
          />
        </section>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Descriptions
        column={1}
        labelStyle={{ width: "120px" }}
        data={[
          {
            label: "当前修订",
            value: instance?.container?.revision ?? "-",
          },
          {
            label: "发布状态",
            value: rolloutStatus ? (rolloutLabels[rolloutStatus] ?? rolloutStatus) : "-",
          },
          {
            label: "就绪副本",
            value: instance?.container
              ? `${instance.container.ready_replicas} / ${instance.container.replicas}`
              : "-",
          },
          { label: "镜像", value: <ImageNameText image={instance?.image} /> },
        ]}
      />
      <DataTable<Release>
        header={{ title: "发布历史", extra: actions, className: "mb-0" }}
        data={releases}
        loading={loading}
        rowKey="revision"
        pagination={false}
        columns={[
          { title: "修订版本", width: 200, dataIndex: "revision", fixed: "left" },
          {
            title: "镜像",
            width: 280,
            ellipsis: true,
            render: (_, release) => getImageDisplayName(release.image),
          },
          {
            title: "发布时间",
            width: 180,
            render: (_, release) => formatDateTime(release.created_at),
          },
        ]}
      />
    </Space>
  );
}
