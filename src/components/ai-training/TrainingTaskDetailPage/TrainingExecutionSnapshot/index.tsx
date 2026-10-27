import { Card, Descriptions, Table } from "@arco-design/web-react";
import type { ModelDevExecution } from "@/api/modeldev";
import { ResourceId } from "@/components/common";
import { formatDateTime } from "@/lib/date";

type TrainingExecutionSnapshotProps = { task: ModelDevExecution };

export default function TrainingExecutionSnapshot({ task }: TrainingExecutionSnapshotProps) {
  const history = task.history;
  const explicit = task.explicit_parameters;
  return (
    <div className="flex flex-col gap-4">
      <Card title="受理配置" bordered={false}>
        <Descriptions
          column={1}
          data={[
            { label: "操作 ID", value: <ResourceId value={task.operation_id} /> },
            { label: "参数契约版本", value: task.parameter_contract_version || "-" },
            { label: "配置摘要", value: task.resolved_configuration_sha256 || "-" },
            { label: "算力选择摘要", value: task.compute?.selection_digest || "-" },
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
      <Card title="训练参数" bordered={false}>
        <Table
          rowKey="name"
          pagination={false}
          data={task.resolved_parameters ?? []}
          columns={[
            { title: "参数", dataIndex: "name", width: 220 },
            { title: "类型", dataIndex: "type", width: 120 },
            { title: "生效值", dataIndex: "value", width: 180 },
            {
              title: "显式提交值",
              width: 180,
              render: (_, row) =>
                explicit && Object.prototype.hasOwnProperty.call(explicit, row.name)
                  ? String(explicit[row.name as keyof typeof explicit])
                  : "未指定",
            },
          ]}
        />
      </Card>
      <Card title="原执行历史" bordered={false}>
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
