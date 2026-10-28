import { Alert, Card, Descriptions, Empty, Table } from "@arco-design/web-react";
import type { ModelDevExecutionDetail, ModelDevExecutionStep } from "@/api/modeldev";
import { StatusBadge, type StatusBadgeTone } from "@/components/common";
import { formatDateTime } from "@/lib/date";

type TrainingTaskPipelineProps = {
  steps: ModelDevExecutionStep[];
  failure: ModelDevExecutionDetail["failure"];
};

const STEP_STATES: Record<string, { label: string; tone: StatusBadgeTone }> = {
  PENDING: { label: "待执行", tone: "neutral" },
  RUNNING: { label: "执行中", tone: "primary" },
  SUCCEEDED: { label: "已成功", tone: "success" },
  FAILED: { label: "失败", tone: "danger" },
  STOPPED: { label: "已停止", tone: "warning" },
};

export default function TrainingTaskPipeline({ steps, failure }: TrainingTaskPipelineProps) {
  return (
    <div className="flex flex-col gap-4">
      {failure && (
        <Card title="失败诊断" bordered={false}>
          <div className="flex flex-col gap-4">
            <Alert type="error" content={failure.safe_message || failure.reason} />
            <Descriptions
              column={1}
              data={[
                { label: "失败原因", value: failure.reason || "-" },
                {
                  label: "排查关联 ID",
                  value: <span className="break-all">{failure.correlation_id || "-"}</span>,
                },
              ]}
            />
            {failure.violations.length > 0 && (
              <Table
                rowKey="field"
                pagination={false}
                data={failure.violations}
                columns={[
                  { title: "字段 / 步骤", dataIndex: "field", width: 240, ellipsis: true },
                  { title: "原因", dataIndex: "reason", width: 320, ellipsis: true },
                ]}
              />
            )}
          </div>
        </Card>
      )}
      <Card title="执行步骤" bordered={false}>
        <Table
          rowKey="role"
          pagination={false}
          data={steps}
          noDataElement={<Empty description="暂无执行步骤" />}
          scroll={{ x: 980 }}
          columns={[
            { title: "步骤", dataIndex: "role", width: 200, ellipsis: true, fixed: "left" },
            {
              title: "状态",
              width: 120,
              render: (_, step) => {
                const state = STEP_STATES[step.state];
                return (
                  <StatusBadge
                    status={step.state}
                    tone={state?.tone ?? "neutral"}
                    loading={step.state === "RUNNING"}
                  >
                    {state?.label ?? step.state}
                  </StatusBadge>
                );
              },
            },
            { title: "开始时间", width: 180, render: (_, step) => formatDateTime(step.started_at) },
            {
              title: "结束时间",
              width: 180,
              render: (_, step) => formatDateTime(step.finished_at),
            },
            {
              title: "截止时间",
              width: 180,
              render: (_, step) => formatDateTime(step.deadline_at),
            },
            {
              title: "退出码",
              width: 120,
              render: (_, step) => (step.finished_at ? step.exit_code : "-"),
            },
          ]}
        />
      </Card>
    </div>
  );
}
