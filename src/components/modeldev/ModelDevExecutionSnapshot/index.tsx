import { Card, Descriptions } from "@arco-design/web-react";
import type { ModelDevExecutionDetail } from "@/api/modeldev";
import { ResourceIdentity } from "@/components/common";
import { formatDateTime } from "@/lib/date";

type ModelDevExecutionSnapshotProps = { task: ModelDevExecutionDetail };

export default function ModelDevExecutionSnapshot({ task }: ModelDevExecutionSnapshotProps) {
  const history = task.history;
  return (
    <div className="flex flex-col gap-4">
      <Card title="执行配置快照" bordered={false}>
        <Descriptions
          column={1}
          data={[
            { label: "操作 ID", value: <ResourceIdentity display="id" id={task.operation_id} /> },
            { label: "参数契约版本", value: task.parameter_contract_version || "-" },
            { label: "配置摘要", value: task.resolved_configuration_sha256 || "-" },
            { label: "算力选择摘要", value: task.compute?.selection_digest || "-" },
            // FIXME(modeldev-image): image_version_id 已废弃，待镜像契约迁移时改用 image_id / image_version。
            {
              label: "镜像版本",
              value: <ResourceIdentity display="id" id={task.image_version_id} />,
            },
            {
              label: "CPU / 内存",
              value: task.compute
                ? `${task.compute.cpu_millis} mCPU / ${task.compute.memory_mib} MiB`
                : "-",
            },
            { label: "设备模式", value: task.compute?.device_mode || "-" },
            {
              label: "总时长 / 最大总时长",
              value: task.timing
                ? `${task.timing.execution_timeout_seconds} / ${task.timing.execution_timeout_max_seconds} 秒`
                : "-",
            },
            {
              label: "步骤时限",
              value: task.timing ? `${task.timing.step_timeout_seconds} 秒` : "-",
            },
            { label: "关闭代次", value: task.close_generation || "-" },
          ].map((item) => ({ ...item, value: <span className="break-all">{item.value}</span> }))}
        />
      </Card>
      <Card title="执行历史" bordered={false}>
        <Descriptions
          column={1}
          data={[
            { label: "Run ID", value: history?.run_id || "-" },
            { label: "Run 状态", value: history?.run_state || "未知" },
            { label: "Run 结束时间", value: formatDateTime(history?.run_finished_at) },
            { label: "Workflow UID", value: history?.workflow_uid || "-" },
            { label: "Workflow 状态", value: history?.workflow_phase || "未知" },
            { label: "Workflow 结束时间", value: formatDateTime(history?.workflow_finished_at) },
            { label: "Workflow 资源版本", value: history?.workflow_resource_version || "-" },
            { label: "Workflow 节点摘要", value: history?.workflow_nodes_sha256 || "-" },
            { label: "历史观测时间", value: formatDateTime(history?.observed_at) },
          ].map((item) => ({ ...item, value: <span className="break-all">{item.value}</span> }))}
        />
      </Card>
    </div>
  );
}
