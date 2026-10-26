import { useState } from "react";
import { Button, Space, Typography } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getInferencePolicy } from "@/api/inference";
import { DataTable } from "@/components/common";
import { withId } from "@/lib/id";
import { formatDateTime } from "@/lib/format";
import UpdateInferencePolicyModal from "./UpdateInferencePolicyModal";

type InferencePoliciesProps = { serviceId: string };

export default function InferencePolicies({ serviceId }: InferencePoliciesProps) {
  const [editing, setEditing] = useState(false);
  const query = useQuery({
    queryKey: ["governance-inference-policy", serviceId],
    queryFn: ({ signal }) => getInferencePolicy(serviceId, signal),
    meta: {
      errorNotification: { id: withId("inference-policy", serviceId), action: "推理访问策略加载" },
    },
  });
  const policy = query.data?.policy;
  const items = (policy?.allowed_tenants ?? []).map((tenant) => ({
    tenant,
    minute: policy?.rate_limits?.[tenant]?.requests_per_minute ?? 0,
    hour: policy?.rate_limits?.[tenant]?.requests_per_hour ?? 0,
  }));
  return (
    <div className="flex flex-col gap-4">
      <Space>
        <Button loading={query.isFetching} onClick={() => query.refetch()}>
          刷新
        </Button>
        <Button type="primary" disabled={!policy} onClick={() => setEditing(true)}>
          编辑策略
        </Button>
      </Space>
      <DataTable
        data={items}
        rowKey="tenant"
        loading={query.isFetching}
        pagination={false}
        columns={[
          { title: "允许的租户 UUID", dataIndex: "tenant", width: 360, ellipsis: true },
          { title: "每分钟请求上限", width: 180, render: (_, row) => row.minute || "不限" },
          { title: "每小时请求上限", width: 180, render: (_, row) => row.hour || "不限" },
        ]}
        tableLabel="推理服务访问白名单"
      />
      <Typography.Text type="secondary">
        更新时间：{formatDateTime(policy?.updated_at)}
      </Typography.Text>
      {editing && policy && (
        <UpdateInferencePolicyModal
          serviceId={serviceId}
          policy={policy}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
