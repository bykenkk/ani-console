import { Alert, Descriptions } from "@arco-design/web-react";
import type { Sandbox } from "@/api/sandboxes";
import { ResourceId } from "@/components/common";

type SandboxWorkspaceProps = { sandbox: Sandbox };

export default function SandboxWorkspace({ sandbox }: SandboxWorkspaceProps) {
  const workspace = sandbox.snapshot?.workspace;
  const refs = sandbox.provider_refs;
  return (
    <div className="flex flex-col gap-5 p-5">
      <Alert
        type="info"
        content="暂停时保留工作区文件，恢复时重新启动运行环境；内存和运行中的进程不会保留。销毁沙箱会删除工作区数据。"
      />
      <Descriptions
        title="工作区"
        column={1}
        border
        labelStyle={{ width: 180 }}
        data={[
          { label: "挂载路径", value: workspace?.mount_path || "-" },
          { label: "容量", value: workspace?.size || "-" },
          { label: "存储类", value: workspace?.storage_class || "-" },
          { label: "回收策略", value: workspace?.reclaim_policy || "-" },
          { label: "PVC 名称", value: refs?.pvc_name || "-" },
          { label: "PVC UID", value: refs?.pvc_uid ? <ResourceId value={refs.pvc_uid} /> : "-" },
          { label: "PV 名称", value: refs?.pv_name || "-" },
          { label: "PV UID", value: refs?.pv_uid ? <ResourceId value={refs.pv_uid} /> : "-" },
          { label: "PVC 资源版本", value: refs?.pvc_resource_version || "-" },
        ]}
      />
    </div>
  );
}
