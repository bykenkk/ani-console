import { Alert, Card, Descriptions, Table } from "@arco-design/web-react";
import type { ModelDevExecutionDetail } from "@/api/modeldev";
import { ResourceIdentity } from "@/components/common";
import { formatModelDevComputeResources, getModelDevParameterLabel } from "@/lib/modeldev";
import ModelDevFineTuningConfiguration from "../ModelDevFineTuningConfiguration";

type ModelDevExecutionOverviewProps = { task: ModelDevExecutionDetail };

export default function ModelDevExecutionOverview({ task }: ModelDevExecutionOverviewProps) {
  const explicit = task.explicit_parameters;
  const registration = task.model_registration;

  return (
    <div className="flex flex-col gap-4">
      {task.failure && (
        <Alert
          type="error"
          title="失败原因"
          content={task.failure.safe_message || task.failure.reason}
        />
      )}
      <Card title="模型与数据" bordered={false}>
        <Descriptions
          column={1}
          data={[
            ...(task.kind === "FINETUNING"
              ? [
                  {
                    label: "基础模型 ID",
                    value: <ResourceIdentity display="id" id={task.base_model?.model_id} />,
                  },
                  {
                    label: "基础模型版本 ID",
                    value: <ResourceIdentity display="id" id={task.base_model?.version_id} />,
                  },
                  { label: "权重格式", value: task.base_model?.format || "-" },
                ]
              : []),
            {
              label: "数据集版本 ID",
              value: <ResourceIdentity display="id" id={task.input_version_id} />,
            },
          ]}
        />
      </Card>
      <Card title="计算资源" bordered={false}>
        <Descriptions
          column={1}
          data={[
            {
              label: "训练实现",
              value: <ResourceIdentity display="id" id={task.implementation_id} />,
            },
            {
              label: "算力规格 ID",
              value: <ResourceIdentity display="id" id={task.compute_preset_id} />,
            },
            { label: "CPU / 内存", value: formatModelDevComputeResources(task.compute) },
            { label: "设备模式", value: task.compute?.device_mode || "-" },
            {
              label: "任务时限",
              value: task.timing ? `${task.timing.execution_timeout_seconds} 秒` : "-",
            },
          ]}
        />
      </Card>
      <Card title="训练参数" bordered={false}>
        <Table
          rowKey="name"
          pagination={false}
          data={task.resolved_parameters ?? []}
          scroll={{ x: 880 }}
          columns={[
            {
              title: "参数",
              width: 200,
              ellipsis: true,
              render: (_, row) => getModelDevParameterLabel(row.name),
            },
            { title: "参数名", dataIndex: "name", width: 200, ellipsis: true },
            { title: "类型", dataIndex: "type", width: 120, ellipsis: true },
            { title: "生效值", dataIndex: "value", width: 180, ellipsis: true },
            {
              title: "显式提交值",
              width: 180,
              ellipsis: true,
              render: (_, row) =>
                explicit && Object.prototype.hasOwnProperty.call(explicit, row.name)
                  ? String(explicit[row.name as keyof typeof explicit])
                  : "未指定",
            },
          ]}
        />
      </Card>
      {task.kind === "FINETUNING" && (
        <ModelDevFineTuningConfiguration managedSettings={task.managed_settings} />
      )}
      {(task.kind === "FINETUNING" || registration) && (
        <Card title="输出模型" bordered={false}>
          <Descriptions
            column={1}
            data={[
              { label: "登记状态", value: registration?.state || "无登记记录" },
              {
                label: "登记 ID",
                value: <ResourceIdentity display="id" id={registration?.registration_id} />,
              },
              {
                label: "模型 ID",
                value: <ResourceIdentity display="id" id={registration?.model_id} />,
              },
              {
                label: "模型版本 ID",
                value: <ResourceIdentity display="id" id={registration?.model_version_id} />,
              },
              { label: "失败原因", value: registration?.failure_code || "-" },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
