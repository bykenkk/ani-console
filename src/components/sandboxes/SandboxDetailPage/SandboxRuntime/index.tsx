import { Descriptions } from "@arco-design/web-react";
import type { Sandbox } from "@/api/sandboxes";
import { ResourceId, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";

type SandboxRuntimeProps = { sandbox: Sandbox };

export default function SandboxRuntime({ sandbox }: SandboxRuntimeProps) {
  const refs = sandbox.provider_refs;
  return (
    <div className="p-5">
      <Descriptions
        title="运行资源"
        column={1}
        border
        labelStyle={{ width: 180 }}
        data={[
          {
            label: "当前状态",
            value: <StatusBadge status={sandbox.observed_state} loading={false} />,
          },
          { label: "期望状态", value: sandbox.desired_state || "-" },
          { label: "状态原因", value: sandbox.reason || "-" },
          { label: "状态观测时间", value: formatDateTime(sandbox.observed_at) },
          {
            label: "集群 ID",
            value: sandbox.snapshot?.cluster_id ? (
              <ResourceId value={sandbox.snapshot.cluster_id} />
            ) : (
              "-"
            ),
          },
          { label: "命名空间", value: sandbox.snapshot?.namespace || "-" },
          { label: "RuntimeClass", value: sandbox.snapshot?.runtime_class || "-" },
          { label: "Pod 名称", value: refs?.pod_name || "-" },
          { label: "Pod UID", value: refs?.pod_uid ? <ResourceId value={refs.pod_uid} /> : "-" },
          { label: "Pod 资源版本", value: refs?.pod_resource_version || "-" },
        ]}
      />
    </div>
  );
}
