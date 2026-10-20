import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Descriptions, Modal, Space } from "@arco-design/web-react";
import { getInstanceOperation, type InstanceAcceptance } from "@/api/instances";
import { ResourceId, StatusBadge } from "@/components/common";
import { withId } from "@/lib/id";

export default function InstanceOperationModal({
  acceptance,
  deleting = false,
  onCancel,
}: {
  acceptance: InstanceAcceptance;
  deleting?: boolean;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["governance-instance-operation", acceptance.operationId],
    queryFn: ({ signal }) => getInstanceOperation(acceptance.operationId, signal),
    enabled: Boolean(acceptance.operationId),
    meta: {
      errorNotification: {
        id: withId("instance-operation", acceptance.operationId),
        action: "实例操作状态加载",
      },
    },
  });
  const refresh = async () => {
    await query.refetch();
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["governance-instances"] }),
      qc.invalidateQueries({ queryKey: ["legacy-instances"] }),
      qc.invalidateQueries({
        queryKey: ["governance-instance-runtime", acceptance.resourceId],
        refetchType: deleting ? "none" : "active",
      }),
      qc.invalidateQueries({
        queryKey: ["governance-instance", acceptance.resourceId],
        refetchType: deleting ? "none" : "active",
      }),
    ]);
  };
  return (
    <Modal
      visible
      title="实例操作状态"
      onCancel={onCancel}
      footer={
        <Space>
          <Button loading={query.isFetching} onClick={refresh}>
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
          { label: "实例 ID", value: <ResourceId value={acceptance.resourceId} /> },
          { label: "操作 ID", value: <ResourceId value={acceptance.operationId} /> },
          { label: "操作", value: query.data?.action || "-" },
          {
            label: "状态",
            value: <StatusBadge status={query.data?.state} reason={query.data?.reason} />,
          },
          { label: "原因", value: query.data?.reason || "-" },
        ]}
      />
    </Modal>
  );
}
