// FIXME(governance-migration): 挂载观测已接新 runtime，云盘/NFS 关联及管理操作继续保留原组件、入口和旧数据。
// TODO(governance-migration): 等存储关联与操作契约齐备后迁移，旧操作继续使用 legacy。
import { type InstanceRecord } from "@/api/instances/legacy";
import type { InstanceRuntime } from "@/api/instances";

import { DataTable, StatusBadge, type RowAction } from "@/components/common";

import { Button, Space } from "@arco-design/web-react";

type Instance = InstanceRecord;
type Volume = NonNullable<Instance["volumes"]>[number];
type FilesystemAttachment = NonNullable<Instance["storage_attachments"]>[number];
export default function InstanceStorage({
  instance,
  runtime,
  loading = false,
  mountVolume,
  mountFilesystem,
}: {
  instance?: Instance;
  runtime?: InstanceRuntime;
  loading?: boolean;
  mountVolume?: RowAction<Instance>;
  mountFilesystem?: RowAction<Instance>;
}) {
  const volumes = instance?.volumes ?? [];
  const filesystems = (instance?.storage_attachments ?? []).filter(
    (attachment) => attachment.resource_type === "filesystem",
  );
  return (
    <>
      <Space direction="vertical" size={24} className="w-full">
        {runtime && (
          <section>
            <DataTable
              header={{ title: "运行时挂载" }}
              data={runtime.pod?.mounts ?? []}
              rowKey={(mount) => `${mount.name}:${mount.mountPath}`}
              pagination={false}
              columns={[
                { title: "名称", dataIndex: "name", width: 180, ellipsis: true },
                { title: "类型", dataIndex: "volumeType", width: 150 },
                { title: "挂载路径", dataIndex: "mountPath", width: 300, ellipsis: true },
                {
                  title: "访问模式",
                  width: 100,
                  render: (_, mount) => (mount.readOnly ? "只读" : "读写"),
                },
              ]}
            />
          </section>
        )}
        <section>
          <DataTable<Volume>
            header={{
              title: "挂载点",
              extra: (
                <Button
                  disabled={!instance || !mountVolume || mountVolume.disabled?.(instance)}
                  onClick={() => {
                    if (instance) mountVolume?.onClick(instance);
                  }}
                >
                  挂载云盘
                </Button>
              ),
            }}
            data={volumes}
            loading={loading}
            rowKey={(volume) =>
              `${volume.kind}:${volume.source_ref ?? volume.name}:${volume.mount_path ?? ""}`
            }
            pagination={false}
            columns={[
              { title: "名称", dataIndex: "name" },
              { title: "类型", dataIndex: "kind", width: 150 },
              {
                title: "挂载路径",
                dataIndex: "mount_path",
                placeholder: "-",
              },
              {
                title: "访问模式",
                width: 100,
                render: (_, volume) => (volume.read_only ? "只读" : "读写"),
              },
            ]}
          />
        </section>

        <section>
          <DataTable<FilesystemAttachment>
            header={{
              title: "文件存储 NFS",
              extra: (
                <Button
                  disabled={!instance || !mountFilesystem || mountFilesystem.disabled?.(instance)}
                  onClick={() => {
                    if (instance) mountFilesystem?.onClick(instance);
                  }}
                >
                  挂载 NFS
                </Button>
              ),
            }}
            data={filesystems}
            loading={loading}
            rowKey={(filesystem) => `${filesystem.resource_id}:${filesystem.mount_path ?? ""}`}
            pagination={false}
            columns={[
              {
                title: "文件存储",
                render: (_, filesystem) => filesystem.resource_name ?? filesystem.resource_id,
              },
              { title: "文件系统 ID", dataIndex: "resource_id" },
              {
                title: "挂载路径",
                dataIndex: "mount_path",
                placeholder: "-",
              },
              {
                title: "访问模式",
                width: 100,
                render: (_, filesystem) => (filesystem.read_only ? "只读" : "读写"),
              },
              {
                title: "状态",
                width: 120,
                render: (_, filesystem) =>
                  filesystem.status ? <StatusBadge status={filesystem.status} /> : "-",
              },
            ]}
          />
        </section>
      </Space>
    </>
  );
}
