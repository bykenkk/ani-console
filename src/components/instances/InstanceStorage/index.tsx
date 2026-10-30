import { Button } from "@arco-design/web-react";
import { DataTable } from "@/components/common";
import type { InstanceConfigurationData, InstanceRuntime, InstanceRecord } from "@/api/instances";
import { useIsMutating } from "@tanstack/react-query";
import InstanceAttachPvcModal from "@/components/instances/InstanceAttachPvcModal";
import InstanceDetachPvcModal from "@/components/instances/InstanceDetachPvcModal";
import { instanceIntentUnavailable } from "@/hooks/useInstanceCommandMutation";
import { useState, type ReactNode } from "react";

type InstanceStorageProps = {
  instance?: InstanceRecord;
  configuration?: InstanceConfigurationData;
  runtime?: InstanceRuntime;
  loading?: boolean;
  diskContent?: ReactNode;
};
// TODO(feature-visibility): 待文件存储支持后随 NFS 区域恢复行类型。
// type FilesystemRow = {
//   id: string;
//   name: string;
//   mount_path: string;
//   access_mode: string;
//   status: string;
// };

export default function InstanceStorage({
  instance,
  configuration,
  runtime,
  loading = false,
  diskContent,
}: InstanceStorageProps) {
  const [dialog, setDialog] = useState<
    | { action: "attach"; instance: InstanceRecord }
    | { action: "detach"; instance: InstanceRecord; mountPath: string }
  >();
  const submitting = useIsMutating({ mutationKey: ["instance-command"] }) > 0;
  const unavailable =
    !instance ||
    !configuration ||
    loading ||
    Boolean(dialog) ||
    submitting ||
    Boolean(configuration.pending_change) ||
    instanceIntentUnavailable(instance);
  // 当前权威配置的挂载路径唯一；运行态卷名不是 PVC 名，按同一实例的容器内路径对应。
  const runtimeMounts =
    runtime?.instance_id === configuration?.instance_id ? (runtime?.pod?.mounts ?? []) : [];
  // TODO(instance-volume-type): 联调核对运行态类型；无观测、路径不唯一或只读属性不一致时保留占位。
  return (
    <div className="flex w-full flex-col gap-6">
      {diskContent ?? (
        <DataTable
          header={{
            title: "挂载点",
            extra: (
              <Button
                disabled={unavailable || (configuration?.volume_mounts.length ?? 0) >= 8}
                onClick={() => {
                  if (instance && !unavailable) setDialog({ action: "attach", instance });
                }}
              >
                挂载云盘
              </Button>
            ),
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
                const mounts = runtimeMounts.filter(
                  (mount) => mount.mountPath === volume.mount_path,
                );
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
            ...(instance
              ? [
                  {
                    title: "操作",
                    width: 100,
                    render: (
                      _: unknown,
                      volume: NonNullable<InstanceConfigurationData["volume_mounts"]>[number],
                    ) =>
                      volume.mount_path === configuration?.workspace_mount_path ? null : (
                        <Button
                          type="text"
                          status="danger"
                          disabled={unavailable}
                          onClick={() =>
                            setDialog({ action: "detach", instance, mountPath: volume.mount_path })
                          }
                        >
                          卸载
                        </Button>
                      ),
                  },
                ]
              : []),
          ]}
        />
      )}
      {dialog?.action === "attach" && (
        <InstanceAttachPvcModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={() => setDialog(undefined)}
        />
      )}
      {dialog?.action === "detach" && (
        <InstanceDetachPvcModal
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
