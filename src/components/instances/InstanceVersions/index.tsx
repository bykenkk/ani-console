import { Button, Descriptions, Space, Typography } from "@arco-design/web-react";
import type { InstanceRecord } from "@/api/instances";
import { DataTable } from "@/components/common";

type InstanceVersionsProps = {
  currentImage?: Pick<InstanceRecord, "imageId" | "imageDigest">;
};

export default function InstanceVersions({ currentImage }: InstanceVersionsProps) {
  // TODO(instance-detail-migration): 当前镜像公共展示需在全部实例类型完成字段对齐及联调后移除此标记。
  // FIXME(instance-version-history): 当前实例合同没有发布版本、更新时间及历史列表；实例 version 不是发布修订。
  // TODO(instance-version-history): 正式版本、镜像更新与回滚契约对齐并联调验证后接入，保留现有入口与字段。
  return (
    <Space direction="vertical" size={32} className="w-full">
      <section>
        <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
          <Typography.Title heading={6} className="m-0!">
            当前镜像
          </Typography.Title>
          <Button disabled title="更新镜像暂未开放">
            更新镜像
          </Button>
        </div>
        <Descriptions
          column={1}
          labelStyle={{ width: "120px" }}
          data={[
            { label: "镜像 ID", value: currentImage?.imageId || "-" },
            { label: "镜像摘要", value: currentImage?.imageDigest || "-" },
            { label: "版本", value: "-" },
            { label: "更新时间", value: "-" },
          ]}
        />
      </section>
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
    </Space>
  );
}
