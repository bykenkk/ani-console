import { Button, Descriptions, Space } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getNetworkLoadBalancerOperation } from "@/api/network";
import { StatusBadge } from "@/components/common";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/format";

export default function LoadBalancerOperation({ operationId }: { operationId?: string }) {
  const operation = useQuery({
    queryKey: ["network-load-balancer-operation", operationId],
    queryFn: ({ signal }) => getNetworkLoadBalancerOperation(operationId!, signal),
    enabled: !!operationId,
    meta: {
      errorNotification: {
        id: withId("load-balancer-operation", operationId ?? "none"),
        action: "负载均衡操作加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    refetchInterval: (query) =>
      query.state.error ||
      !query.state.data ||
      ["succeeded", "failed", "cancelled", "canceled"].includes(query.state.data.state)
        ? false
        : 5000,
  });
  const item = operation.data;
  if (!operationId) return <>-</>;
  return (
    <Space direction="vertical" className="w-full">
      <Descriptions
        column={1}
        data={[
          { label: "操作 ID", value: operationId },
          {
            label: "状态",
            value: item ? <StatusBadge status={item.state} reason={item.reason} /> : "-",
          },
          {
            label: "完成时间",
            value: item?.completed_at ? formatDateTime(item.completed_at) : "-",
          },
        ]}
      />
      <Button size="small" loading={operation.isFetching} onClick={() => operation.refetch()}>
        刷新操作状态
      </Button>
    </Space>
  );
}
