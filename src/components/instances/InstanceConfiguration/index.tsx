// TODO(instance-detail-migration): 云主机、沙箱先统一使用实例公共组件；对应字段、契约及运行时联调验证完成后移除此标记。
import { Descriptions, Space } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import type { InstanceConfigurationData, InstanceRuntime } from "@/api/instances";

type InstanceConfigurationProps = {
  configuration?: InstanceConfigurationData;
  runtime?: InstanceRuntime;
  loading?: boolean;
};

export default function InstanceConfiguration({
  configuration,
  runtime,
  loading = false,
}: InstanceConfigurationProps) {
  const metadata = (record?: Record<string, string>) =>
    Object.entries(record ?? {}).map(([name, value]) => ({ name, value }));
  return (
    <Space direction="vertical" size={24} className="w-full">
      <Descriptions
        column={1}
        data={[{ label: "工作目录", value: configuration?.workspace_mount_path ?? "-" }]}
      />
      <DataTable
        header={{ title: "环境变量来源" }}
        data={runtime?.pod?.environmentSources ?? []}
        rowKey="name"
        pagination={false}
        columns={[
          { title: "名称", dataIndex: "name", ellipsis: true },
          { title: "来源类型", dataIndex: "sourceType", ellipsis: true },
        ]}
      />
      {[
        { title: "环境变量", rows: configuration?.env ?? [] },
        { title: "标签", rows: metadata(configuration?.labels) },
        { title: "注解", rows: metadata(configuration?.annotations) },
      ].map(({ title, rows }) => (
        <DataTable
          key={title}
          header={{ title }}
          data={rows}
          loading={loading}
          rowKey="name"
          pagination={false}
          columns={[
            { title: "名称", dataIndex: "name", width: 240, ellipsis: true },
            {
              title: "值",
              render: (_, row) => (
                <span className="whitespace-pre-wrap break-all font-mono">
                  {row.value === "" ? '""' : row.value}
                </span>
              ),
            },
          ]}
        />
      ))}
      {/* FIXME(instance-secrets): 新配置仅包含字面环境变量，不能据此补造密钥引用或调用未提供的解绑接口。 */}
      {/* TODO(instance-secrets): 保留绑定密钥区块，待 Governance 提供读写契约后接入。 */}
      <DataTable<{ id: string; purpose: string }>
        header={{ title: "绑定密钥" }}
        data={[]}
        pagination={false}
        rowKey="id"
        columns={[
          { title: "密钥", dataIndex: "id" },
          { title: "用途", dataIndex: "purpose" },
        ]}
      />
    </Space>
  );
}
