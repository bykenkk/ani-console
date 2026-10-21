// TODO(instance-detail-migration): 云主机、沙箱先统一使用实例公共组件；对应字段、契约及运行时联调验证完成后移除此标记。
import { Button, Descriptions, Space } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import type { InstanceConfigurationData, InstanceRuntime } from "@/api/instances";

type InstanceStorageProps = {
  configuration?: InstanceConfigurationData;
  workspaceSize?: string;
  runtime?: InstanceRuntime;
  loading?: boolean;
};

export default function InstanceStorage({
  configuration,
  workspaceSize,
  runtime,
  loading = false,
}: InstanceStorageProps) {
  return (
    <Space direction="vertical" size={24} className="w-full">
      <Descriptions
        column={1}
        data={[
          { label: "工作目录", value: configuration?.workspace_mount_path ?? "-" },
          { label: "工作空间容量", value: workspaceSize || "-" },
        ]}
      />
      <DataTable
        header={{ title: "运行时挂载" }}
        data={runtime?.pod?.mounts ?? []}
        rowKey={(mount) => `${mount.name}:${mount.mountPath}`}
        pagination={false}
        columns={[
          { title: "名称", dataIndex: "name", ellipsis: true },
          { title: "类型", dataIndex: "volumeType", width: 150 },
          { title: "挂载路径", dataIndex: "mountPath", ellipsis: true },
          {
            title: "访问模式",
            width: 100,
            render: (_, mount) => (mount.readOnly ? "只读" : "读写"),
          },
        ]}
      />
      {/* FIXME(instance-volume-management): 冻结 PVC 配置仅供回显，不代表支持创建后的挂载或卸载。 */}
      {/* TODO(instance-volume-management): 等 Governance 提供管理契约后启用按钮。 */}
      <DataTable
        header={{
          title: "挂载点",
          extra: (
            <Button disabled title="实例创建后的挂载操作暂未开放">
              挂载云盘
            </Button>
          ),
        }}
        data={configuration?.volume_mounts ?? []}
        loading={loading}
        rowKey={(mount) => `${mount.pvc_name}:${mount.mount_path}`}
        pagination={false}
        columns={[
          { title: "存储卷", dataIndex: "pvc_name", ellipsis: true },
          { title: "挂载路径", dataIndex: "mount_path", ellipsis: true },
          {
            title: "访问模式",
            width: 100,
            render: (_, mount) => (mount.read_only ? "只读" : "读写"),
          },
        ]}
      />
      {/* FIXME(instance-nfs): PVC 配置不能推断旧文件系统 ID，不用 PVC 名替代 NFS 资源身份。 */}
      {/* TODO(instance-nfs): 待文件存储关联契约补齐后恢复数据与管理操作。 */}
      <DataTable<{ id: string; mount_path: string }>
        header={{
          title: "文件存储 NFS",
          extra: (
            <Button disabled title="NFS 挂载管理暂未开放">
              挂载 NFS
            </Button>
          ),
        }}
        data={[]}
        pagination={false}
        rowKey="id"
        columns={[
          { title: "文件系统 ID", dataIndex: "id" },
          { title: "挂载路径", dataIndex: "mount_path" },
        ]}
      />
    </Space>
  );
}
