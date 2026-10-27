import { Space } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import type { InstanceConfigurationData } from "@/api/instances";

type InstanceConfigurationProps = {
  configuration?: InstanceConfigurationData;
  loading?: boolean;
};

export default function InstanceConfiguration({
  configuration,
  loading = false,
}: InstanceConfigurationProps) {
  return (
    <Space direction="vertical" size={24} className="w-full">
      <DataTable
        header={{ title: "环境变量" }}
        data={configuration?.env ?? []}
        loading={loading}
        rowKey="name"
        pagination={false}
        columns={[
          { title: "名称", width: 200, dataIndex: "name", ellipsis: true },
          {
            title: "值",
            width: 320,
            render: (_, row) => (
              <span className="whitespace-pre-wrap break-all font-mono">
                {row.value === "" ? '""' : row.value}
              </span>
            ),
          },
        ]}
      />
      {/* TODO(instance-secrets): Governance 未提供密钥引用，保留原区块空态，待契约补齐并联调后接入。 */}
      <DataTable<{ id: string; purpose: string }>
        header={{ title: "绑定密钥" }}
        data={[]}
        pagination={false}
        rowKey="id"
        columns={[
          { title: "密钥", width: 280, dataIndex: "id" },
          { title: "用途", width: 140, dataIndex: "purpose" },
        ]}
      />
    </Space>
  );
}
