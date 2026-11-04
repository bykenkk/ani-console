import { Button } from "@arco-design/web-react";
import { IconCopy } from "@arco-design/web-react/icon";
import type { InstanceRecord } from "@/api/instances";
import { DataTable } from "@/components/common";
import { copyToClipboard } from "@/lib/clipboard";

type InstanceVersionsProps = {
  currentImage?: Pick<InstanceRecord, "imageId" | "imageDigest">;
};

export default function InstanceVersions({ currentImage }: InstanceVersionsProps) {
  // TODO(instance-detail-migration): 当前镜像公共展示需在全部实例类型完成字段对齐及联调后移除此标记。
  // FIXME(instance-version-history): 当前实例合同没有发布版本、更新时间及历史列表；实例 version 不是发布修订。
  // TODO(instance-version-history): 正式版本、镜像更新与回滚契约对齐并联调验证后接入，保留现有入口与字段。
  return (
    <div className="flex w-full flex-col gap-4">
      <DataTable
        header={{
          title: "当前镜像",
          extra: (
            <Button type="primary" disabled title="更新镜像暂未开放">
              更新镜像
            </Button>
          ),
        }}
        tableLabel="当前镜像"
        data={currentImage ? [currentImage] : []}
        rowKey={() => "current"}
        pagination={false}
        columns={[
          ...[
            { title: "ID", dataIndex: "imageId" as const, width: 180 },
            { title: "摘要", dataIndex: "imageDigest" as const, width: 180 },
          ].map(({ title, dataIndex, width }) => ({
            title,
            dataIndex,
            width,
            ellipsis: true,
            render: (value: string | undefined) =>
              value ? (
                <>
                  <span className="font-mono" title={value}>
                    {value.length > 16 ? `${value.slice(0, 12)}…` : value}
                  </span>
                  <Button
                    type="text"
                    size="mini"
                    icon={<IconCopy />}
                    aria-label={`复制${title}`}
                    title={`复制${title}`}
                    onClick={() => copyToClipboard(value, title)}
                  />
                </>
              ) : (
                "-"
              ),
          })),
          { title: "版本", width: 240, render: () => "-" },
          { title: "更新时间", width: 180, render: () => "-" },
        ]}
      />
      <DataTable<{ revision: string; image: string; createdAt: string }>
        header={{ title: "版本记录" }}
        data={[]}
        rowKey="revision"
        pagination={false}
        rowActions={[
          {
            key: "rollback",
            label: "回滚到此版本",
            disabled: () => true,
            tooltip: "回滚发布暂未开放",
            onClick: () => undefined,
          },
        ]}
        columns={[
          { title: "版本", dataIndex: "revision", width: 240, ellipsis: true },
          { title: "镜像", width: 280, dataIndex: "image", ellipsis: true },
          { title: "更新时间", width: 180, dataIndex: "createdAt" },
        ]}
      />
    </div>
  );
}
