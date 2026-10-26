import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listNetworkEips } from "@/api/network";

export default function LoadBalancerPublicIpField() {
  const eips = useQuery({
    queryKey: ["network-eips", "options", "load-balancer-create"],
    // TODO(pagination-migration): EIP 仍使用 limit/cursor，暂保留现有单次查询；后端完成 page/pageSize 后改用 withFirst100。
    // TODO: 当前仅查询当前租户的公网 IP；后端提供未绑定等筛选条件后，再限定可选资源范围。
    queryFn: ({ signal }) => listNetworkEips({}, signal),
    meta: {
      errorNotification: {
        id: "eips",
        action: "公网 IP 列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  return (
    <Form.Item
      label="公网 IP"
      field="publicIp"
      rules={[{ required: true, message: "请选择公网 IP" }]}
    >
      <Select
        placeholder="请选择公网 IP"
        loading={eips.isLoading}
        allowClear
        options={(eips.data?.items ?? []).map((item) => ({
          value: item.id,
          label:
            item.address && item.name
              ? `${item.address} · ${item.name}`
              : item.address || item.name || item.id,
        }))}
      />
    </Form.Item>
  );
}
