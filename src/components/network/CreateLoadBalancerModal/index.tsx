import { useState } from "react";
import { validateForm } from "@/lib/form";
import { Form, Input, Modal, Radio } from "@arco-design/web-react";
import {
  createNetworkLoadBalancer,
  getNetworkSubnet,
  type CreateNetworkLoadBalancerInput,
  type NetworkLoadBalancer,
} from "@/api/network";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ipInRanges, parseIpRanges, subnetIpUnavailableReason } from "@/lib/subnets";
import LoadBalancerListenersField from "../LoadBalancerListenersField";
import LoadBalancerNetworkFields from "../LoadBalancerNetworkFields";
import type { LoadBalancerListenerValues } from "../LoadBalancerListenerForm";
import { listenerInput, listenerSetError } from "@/lib/load-balancers";

export type LoadBalancerConfigurationValues = {
  vpc_id: string;
  subnet_id?: string;
  scheme: "internal" | "public" | "both";
  size: "small" | "medium" | "large";
  vip: string;
  publicIp?: string;
  listeners: LoadBalancerListenerValues[];
};
type Values = LoadBalancerConfigurationValues & { name: string; description?: string };
export default function CreateLoadBalancerModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated?: (item: NetworkLoadBalancer) => void;
}) {
  const [form] = Form.useForm<Values>();
  const [available, setAvailable] = useState(false);
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (input: CreateNetworkLoadBalancerInput) => {
      const subnet = await qc.fetchQuery({
        queryKey: ["network-subnet", input.subnet_id],
        queryFn: () => getNetworkSubnet(input.subnet_id),
      });
      const reason = subnetIpUnavailableReason(subnet);
      if (reason) throw new Error(reason);
      if (
        subnet.vpc_id !== input.vpc_id ||
        !ipInRanges(parseIpRanges(subnet.available_ip_range) ?? [], input.private_ip)
      ) {
        throw new Error("所选 IP 已不在可用范围内，请重新选择");
      }
      return createNetworkLoadBalancer(input);
    },
    meta: {
      feedback: {
        channel: "message",
        action: "创建负载均衡",
        successText: "负载均衡创建已提交",
        errorFallback: "创建失败，请稍后重试",
      },
    },
    onSuccess: async (result) => {
      await Promise.all(
        [
          "network-load-balancers",
          "network-subnets",
          "network-subnet",
          "network-eips",
          "network-eip",
        ].map((key) => qc.invalidateQueries({ queryKey: [key] })),
      );
      onCreated?.(result.load_balancer);
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建负载均衡"
      autoFocus={false}
      style={{ width: 900 }}
      onCancel={onCancel}
      okText="创建"
      okButtonProps={{ disabled: !available }}
      confirmLoading={create.isPending}
      maskClosable={!create.isPending}
      closable={!create.isPending}
      cancelButtonProps={{ disabled: create.isPending }}
      onOk={async () => {
        const values = await validateForm<Values>(form);
        await create.mutateAsync({
          name: values.name.trim(),
          description: values.description,
          vpc_id: values.vpc_id,
          subnet_id: values.subnet_id!,
          exposure:
            values.scheme === "internal"
              ? "LOAD_BALANCER_EXPOSURE_PRIVATE"
              : values.scheme === "public"
                ? "LOAD_BALANCER_EXPOSURE_PUBLIC"
                : "LOAD_BALANCER_EXPOSURE_PUBLIC_PRIVATE",
          flavor: values.size,
          private_ip: values.vip,
          public_eip_id: values.scheme === "internal" ? undefined : values.publicIp,
          listeners: { items: values.listeners.map(listenerInput) },
        });
      }}
    >
      <Form
        form={form}
        disabled={create.isPending}
        layout="vertical"
        initialValues={{ scheme: "internal", size: "small", listeners: [] }}
      >
        <Form.Item label="名称" field="name" rules={[{ required: true, match: /\S/ }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item label="描述" field="description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item label="规格" field="size">
          <Radio.Group
            type="button"
            options={[
              { label: "小型", value: "small" },
              { label: "中型", value: "medium" },
              { label: "大型", value: "large" },
            ]}
          />
        </Form.Item>
        <Form.Item label="网络类型" field="scheme">
          <Radio.Group
            type="button"
            options={[
              { label: "公网", value: "public" },
              { label: "私网", value: "internal" },
              { label: "公网+私网", value: "both" },
            ]}
          />
        </Form.Item>
        <LoadBalancerNetworkFields form={form} onAvailabilityChange={setAvailable} />
        <Form.Item noStyle shouldUpdate={(prev, next) => prev.vpc_id !== next.vpc_id}>
          {(values) => (
            <Form.Item
              label="监听器"
              field="listeners"
              rules={[{ validator: (value, callback) => callback(listenerSetError(value)) }]}
            >
              <LoadBalancerListenersField disabled={!values.vpc_id || create.isPending} />
            </Form.Item>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}
