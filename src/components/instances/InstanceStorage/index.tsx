import { Button, Space } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import type { InstanceConfigurationData, InstanceRuntime } from "@/api/instances";

type InstanceStorageProps = {
  configuration?: InstanceConfigurationData;
  runtime?: InstanceRuntime;
  loading?: boolean;
};
type FilesystemRow = {
  id: string;
  name: string;
  mount_path: string;
  access_mode: string;
  status: string;
};

export default function InstanceStorage({
  configuration,
  runtime,
  loading = false,
}: InstanceStorageProps) {
  // 冻结配置的挂载路径唯一；运行态卷名不是 PVC 名，按同一实例的容器内路径对应。
  const runtimeMounts =
    runtime?.instance_id === configuration?.instance_id ? (runtime?.pod?.mounts ?? []) : [];
  // TODO(instance-volume-management): 创建后挂载、卸载操作待正式契约补齐并联调后接入。
  // TODO(instance-volume-type): 联调核对运行态类型；无观测、路径不唯一或只读属性不一致时保留占位。
  return (
    <Space direction="vertical" size={24} className="w-full">
      <DataTable
        header={{
          title: "挂载点",
          extra: <Button disabled>挂载云盘</Button>,
        }}
        data={configuration?.volume_mounts ?? []}
        loading={loading}
        rowKey={(volume) => `${volume.pvc_name}:${volume.mount_path}`}
        pagination={false}
        columns={[
          { title: "名称", width: 200, dataIndex: "pvc_name", ellipsis: true },
          {
            title: "类型",
            width: 150,
            render: (_, volume) => {
              const mounts = runtimeMounts.filter((mount) => mount.mountPath === volume.mount_path);
              return mounts.length === 1 && mounts[0].readOnly === volume.read_only
                ? mounts[0].volumeType || "-"
                : "-";
            },
          },
          { title: "挂载路径", width: 280, dataIndex: "mount_path", ellipsis: true },
          {
            title: "访问模式",
            width: 100,
            render: (_, volume) => (volume.read_only ? "只读" : "读写"),
          },
        ]}
      />
      {/* TODO(instance-nfs): 新接口未提供 NFS 关联与管理能力，保留原表格和按钮，待契约补齐并联调后接入。 */}
      <DataTable<FilesystemRow>
        header={{
          title: "文件存储 NFS",
          extra: <Button disabled>挂载 NFS</Button>,
        }}
        data={[]}
        pagination={false}
        rowKey="id"
        columns={[
          { title: "文件存储", width: 200, dataIndex: "name" },
          { title: "文件系统 ID", width: 280, dataIndex: "id" },
          { title: "挂载路径", width: 280, dataIndex: "mount_path", ellipsis: true },
          { title: "访问模式", width: 100, dataIndex: "access_mode" },
          { title: "状态", width: 120, dataIndex: "status" },
        ]}
      />
    </Space>
  );
}
