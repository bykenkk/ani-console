import { Button, Descriptions, Modal, Space } from "@arco-design/web-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getInferenceOperation, type InferenceAcceptance } from "@/api/inference";
import { ResourceId, StatusBadge } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

export default function InferenceOperationModal({
  acceptance,
  deleting = false,
  onCancel,
}: {
  acceptance: InferenceAcceptance;
  deleting?: boolean;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const operationId = acceptance.dispatch_operation_id || acceptance.operation_id;
  const canceledBeforeDispatch = acceptance.result === "CANCELED_BEFORE_DISPATCH";
  const operation = useQuery({
    queryKey: ["governance-inference-operation", operationId],
    enabled: Boolean(operationId) && !canceledBeforeDispatch,
    queryFn: ({ signal }) => getInferenceOperation(operationId, signal),
    meta: {
      errorNotification: {
        id: withId("inference-operation", operationId),
        action: "推理操作状态加载",
      },
    },
  });
  const terminal = ["succeeded", "failed"].includes(operation.data?.phase ?? "");
  useEffect(() => {
    if (!terminal) return;
    qc.invalidateQueries({ queryKey: ["governance-inference-services"] });
    qc.invalidateQueries({
      queryKey: ["governance-inference-service", acceptance.resource_id],
      refetchType: deleting ? "none" : "active",
    });
  }, [terminal, qc, acceptance.resource_id, deleting]);
  return (
    <Modal
      visible
      title="推理操作状态"
      onCancel={onCancel}
      footer={
        <Space>
          <Button
            disabled={canceledBeforeDispatch || !operationId}
            loading={operation.isFetching}
            onClick={() => operation.refetch()}
          >
            刷新
          </Button>
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        </Space>
      }
    >
      <Descriptions
        column={1}
        data={[
          { label: "受理结果", value: acceptance.result },
          { label: "操作 ID", value: <ResourceId value={operationId || "-"} /> },
          { label: "资源 ID", value: <ResourceId value={acceptance.resource_id} /> },
          { label: "操作类型", value: operation.data?.kind || "-" },
          {
            label: "执行阶段",
            value: canceledBeforeDispatch ? (
              "下发前已取消"
            ) : (
              <StatusBadge
                status={operation.data?.phase}
                reason={operation.data?.error_code}
                message={operation.data?.error_message}
              />
            ),
          },
          { label: "当前步骤", value: operation.data?.step || "-" },
          { label: "目标版本", value: operation.data?.target_generation || "-" },
          { label: "创建时间", value: formatDateTime(operation.data?.created_at) },
          { label: "完成时间", value: formatDateTime(operation.data?.completed_at) },
        ]}
      />
    </Modal>
  );
}
