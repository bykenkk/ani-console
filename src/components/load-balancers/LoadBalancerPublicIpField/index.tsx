import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listNetworkEips } from "@/api/network";

export default function LoadBalancerPublicIpField() {
  const eips = useQuery({
    queryKey: ["network-eips", "load-balancer-create"],
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
        showSearch
        allowClear
        options={(eips.data?.items ?? [])
          .filter((item) => !!item.address)
          .map((item) => ({
            value: item.id,
            label: item.name ? `${item.address} · ${item.name}` : item.address,
          }))}
      />
    </Form.Item>
  );
}
