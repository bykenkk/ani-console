import { Button } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import type { InstanceConfigurationData, InstanceRecord } from "@/api/instances";
import { useIsMutating } from "@tanstack/react-query";
import ContainerAttachPvcModal from "@/components/instances/ContainerAttachPvcModal";
import ContainerDetachPvcModal from "@/components/instances/ContainerDetachPvcModal";
import { instanceIntentUnavailable } from "@/lib/instances";
import { useState } from "react";

type ContainerStorageProps = {
  instance: InstanceRecord;
  configuration?: InstanceConfigurationData;
  onRefresh: () => Promise<unknown>;
};
// TODO(feature-visibility): 待文件存储支持后随 NFS 区域恢复行类型。
// type FilesystemRow = {
//   id: string;
//   name: string;
//   mount_path: string;
//   access_mode: string;
//   status: string;
// };

export default function ContainerStorage({
  instance,
  configuration,
  onRefresh,
}: ContainerStorageProps) {
  const [dialog, setDialog] = useState<
    | { action: "attach"; instance: InstanceRecord }
    | { action: "detach"; instance: InstanceRecord; mountPath: string }
  >();
  const submitting = useIsMutating({ mutationKey: ["instance-command"] }) > 0;
  const unavailable =
    !configuration ||
    Boolean(dialog) ||
    submitting ||
    Boolean(configuration.pending_change) ||
    instanceIntentUnavailable(instance);
  return (
    <div className="flex w-full flex-col gap-4">
      <DataTable
        header={{
          extra: (
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                disabled={unavailable || (configuration?.volume_mounts.length ?? 0) >= 8}
                onClick={() => {
                  if (!unavailable) setDialog({ action: "attach", instance });
                }}
              >
                挂载云盘
              </Button>
              <Button onClick={onRefresh}>刷新</Button>
            </div>
          ),
        }}
        data={configuration?.volume_mounts ?? []}
        rowKey={(volume) => `${volume.pvc_name}:${volume.mount_path}`}
        pagination={false}
        rowActions={[
          {
            key: "detach",
            label: "卸载",
            intent: "danger",
            visible: (volume) => volume.mount_path !== configuration?.workspace_mount_path,
            disabled: () => unavailable,
            onClick: (volume) =>
              setDialog({ action: "detach", instance, mountPath: volume.mount_path }),
          },
        ]}
        columns={[
          { title: "名称", width: 200, dataIndex: "pvc_name", ellipsis: true },
          {
            title: "权限",
            width: 100,
            render: (_, volume) => (volume.read_only ? "只读" : "读写"),
          },
          { title: "挂载路径", width: 280, dataIndex: "mount_path", ellipsis: true },
        ]}
      />
      {dialog?.action === "attach" && (
        <ContainerAttachPvcModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={() => setDialog(undefined)}
        />
      )}
      {dialog?.action === "detach" && (
        <ContainerDetachPvcModal
          instance={dialog.instance}
          mountPath={dialog.mountPath}
          onCancel={() => setDialog(undefined)}
          onSubmitted={() => setDialog(undefined)}
        />
      )}
      {/* TODO(instance-nfs): 新接口未提供 NFS 关联与管理能力，保留原表格和按钮，待契约补齐并联调后接入。 */}
      {/* TODO(feature-visibility): 待文件存储支持后恢复 NFS 区域及挂载入口。 */}
      {/* <DataTable<FilesystemRow>
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
      /> */}
    </div>
  );
}
