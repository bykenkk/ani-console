import { Form, Grid, Select } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listNetworkSubnets, listNetworkVpcs } from "@/api/network";

import type { LoadBalancerConfigurationValues } from "@/components/network/CreateLoadBalancerModal";
import LoadBalancerPublicIpField from "@/components/network/LoadBalancerPublicIpField";

export default function LoadBalancerNetworkFields({
  form,
}: {
  form: FormInstance<LoadBalancerConfigurationValues>;
}) {
  const [vpcId, setVpcId] = useState<string>();
  const vpcs = useQuery({
    queryKey: ["network-vpcs", "load-balancer-create"],
    queryFn: () => listNetworkVpcs(),
    meta: {
      errorNotification: { id: "vpcs", action: "VPC 列表加载", fallback: "请求失败，请稍后重试" },
    },
  });
  const subnets = useQuery({
    queryKey: ["network-subnets", "load-balancer-create", vpcId],
    queryFn: () => listNetworkSubnets({ vpc_id: vpcId }),
    enabled: !!vpcId,
    meta: {
      errorNotification: {
        id: "subnets",
        action: "子网列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const availableSubnets = subnets.data?.items ?? [];
  return (
    <>
      <Form.Item noStyle shouldUpdate={(previous, next) => previous.scheme !== next.scheme}>
        {(values) =>
          (values.scheme === "public" || values.scheme === "both") && <LoadBalancerPublicIpField />
        }
      </Form.Item>
      <Grid.Row>
        <Grid.Col span={12} style={{ paddingRight: 8, minWidth: 0 }}>
          <Form.Item label="VPC" field="vpc_id" rules={[{ required: true, message: "请选择 VPC" }]}>
            <Select
              placeholder="请选择 VPC"
              loading={vpcs.isLoading}
              onChange={(value) => {
                setVpcId(value);
                form.setFieldsValue({ subnet_id: undefined, vip: "" });
              }}
              options={(vpcs.data?.items ?? []).map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.cidr}`,
              }))}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={12} style={{ paddingLeft: 8, minWidth: 0 }}>
          <Form.Item
            label="子网"
            field="subnet_id"
            rules={[{ required: true, message: "请选择子网" }]}
          >
            <Select
              placeholder={vpcId ? "请选择用于 VIP 的子网" : "请先选择 VPC"}
              disabled={!vpcId}
              loading={subnets.isLoading}
              allowClear
              onChange={() => form.setFieldValue("vip", "")}
              options={availableSubnets.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.cidr}`,
              }))}
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
      <Form.Item noStyle shouldUpdate={(previous, next) => previous.subnet_id !== next.subnet_id}>
        {(values) => (
          <Form.Item
            label="指定 IP"
            field="vip"
            rules={[{ required: true, message: "请选择指定 IP" }]}
          >
            <Select
              placeholder={values.subnet_id ? "请选择指定 IP" : "请先选择子网"}
              disabled={!values.subnet_id}
              showSearch
              allowClear
              // TODO: 核对并接入子网可选 IP 契约；不可通过 CIDR 推算地址可用性。
              options={[]}
            />
          </Form.Item>
        )}
      </Form.Item>
    </>
  );
}
