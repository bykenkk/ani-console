import { createNetworkSubnet, listNetworkVpcs, type NetworkVPC } from "@/api/network";
import { Ipv4CidrInput } from "@/components/common";
import { validateForm } from "@/lib/form";
import { Form, Input, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ipv4CidrWithinError,
  optionalIpv4Error,
  optionalIpv4WithinCidr,
  optionalIpv4WithinCidrError,
  requireIpv4CidrWithin,
  subnetFixedOctets,
  suggestGatewayIp,
  suggestSubnetCidr,
} from "@/lib/validators";
import { withFirst100 } from "@/api/pagination";

type CreateSubnetModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

const listVpcOptions = withFirst100(listNetworkVpcs);

type Vpc = NetworkVPC;

export default function CreateSubnetModal({ onCancel, onCreated }: CreateSubnetModalProps) {
  const [form] = Form.useForm();
  const [name, setName] = useState("");
  const [vpcId, setVpcId] = useState("");
  const [cidr, setCidr] = useState("10.0.1.0/24");
  const [gateway, setGateway] = useState("");
  const vpcs = useQuery({
    meta: {
      errorNotification: {
        id: "vpcs",
        action: "数据加载",
        fallback: "请求失败，请稍后重试",
      },
    },
    queryKey: ["network-vpcs", "subnet-page", "options"],
    queryFn: () => listVpcOptions({}),
  });
  const selectedVpc = ((vpcs.data?.items ?? []) as Vpc[]).find((vpc) => vpc.id === vpcId);
  const selectedVpcCidr = selectedVpc?.cidr ?? "";
  const cidrError = selectedVpcCidr
    ? ipv4CidrWithinError(cidr, selectedVpcCidr, "CIDR", "VPC CIDR")
    : undefined;
  const gatewayError = cidr
    ? optionalIpv4WithinCidrError(gateway, cidr, "网关", "CIDR")
    : optionalIpv4Error(gateway, "网关");
  const fixedOctets = selectedVpcCidr ? subnetFixedOctets(selectedVpcCidr) : [];
  const selectedVpcPrefix = selectedVpcCidr ? Number(selectedVpcCidr.split("/")[1]) : 0;

  const setSubnetCidr = (nextCidr: string) => {
    setCidr(nextCidr);
    try {
      setGateway(suggestGatewayIp(nextCidr));
    } catch {
      /* Keep the last valid gateway while editing. */
    }
  };
  const createSubnet = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建子网",
        successText: "子网创建已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("请输入子网名称");
      if (!selectedVpcCidr) throw new Error("请选择 VPC");
      const submitData = {
        name: trimmedName,
        vpc_id: vpcId,
        cidr: requireIpv4CidrWithin(cidr, selectedVpcCidr, "CIDR", "VPC CIDR"),
        gateway: optionalIpv4WithinCidr(gateway, cidr, "网关", "CIDR"),
      };
      return createNetworkSubnet(submitData);
    },
    onSuccess: () => {
      onCreated();
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建子网"
      onCancel={onCancel}
      onOk={async () => {
        await validateForm(form);
        return createSubnet.mutateAsync();
      }}
      confirmLoading={createSubnet.isPending}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item
          field="name"
          label="名称"
          rules={[{ required: true, message: "请输入子网名称" }]}
        >
          <Input
            value={name}
            onChange={setName}
            placeholder="请输入子网名称"
            maxLength={64}
            showWordLimit
          />
        </Form.Item>
        <Form.Item field="vpcId" label="VPC" rules={[{ required: true, message: "请选择 VPC" }]}>
          <Select
            value={vpcId || undefined}
            onChange={(nextVpcId) => {
              setVpcId(nextVpcId);
              const vpc = ((vpcs.data?.items ?? []) as Vpc[]).find((item) => item.id === nextVpcId);
              if (vpc) setSubnetCidr(suggestSubnetCidr(vpc.cidr));
            }}
            loading={vpcs.isLoading}
            placeholder="选择 VPC"
          >
            {((vpcs.data?.items ?? []) as Vpc[]).map((vpc) => (
              <Select.Option key={vpc.id} value={vpc.id}>
                {vpc.name} · {vpc.cidr}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="CIDR"
          required
          validateStatus={cidrError ? "error" : undefined}
          help={cidrError}
        >
          <Ipv4CidrInput
            value={cidr}
            onChange={setSubnetCidr}
            placeholder="10.0.1.0"
            withPrefix
            disabledOctets={fixedOctets}
            minPrefix={selectedVpcPrefix}
          />
        </Form.Item>
        <Form.Item
          label="网关"
          validateStatus={gatewayError ? "error" : undefined}
          help={gatewayError}
        >
          <Ipv4CidrInput value={gateway} onChange={setGateway} placeholder="10.0.1.1" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
