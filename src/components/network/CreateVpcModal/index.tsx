import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, Input, Modal } from "@arco-design/web-react";
import { useState } from "react";
import { createNetworkVpc, listNetworkVpcCidrPresets } from "@/api/network";
import VpcCidrField from "../VpcCidrField";

export default function CreateVpcModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [cidr, setCidr] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const presets = useQuery({
    queryKey: ["network-vpc-cidr-presets"],
    enabled: false,
    queryFn: ({ signal }) => listNetworkVpcCidrPresets(signal),
    meta: {
      errorNotification: {
        id: "vpc-cidr-presets",
        action: "VPC CIDR 加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const cidrs = presets.data?.cidrs ?? [];
  const create = useMutation({
    mutationKey: ["vpc-create"],
    meta: {
      feedback: {
        channel: "message",
        action: "提交创建",
        successText: "创建请求已受理，请查看 VPC 状态",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async () => {
      setSubmitted(true);
      if (!name.trim()) throw new Error("请输入 VPC 名称");
      if (presets.isFetching || presets.isError || !cidrs.includes(cidr)) {
        throw new Error("请选择当前可用的 IPv4 CIDR");
      }
      return createNetworkVpc({ name: name.trim(), cidr });
    },
    onSuccess: onCreated,
  });
  return (
    <Modal
      visible
      title="创建 VPC"
      onCancel={onCancel}
      onOk={() => create.mutateAsync()}
      confirmLoading={create.isPending}
      okButtonProps={{ disabled: presets.isFetching || presets.isError || !cidrs.includes(cidr) }}
    >
      <Form layout="vertical" style={{ minHeight: "min(360px, max(0px, calc(100vh - 240px)))" }}>
        <Form.Item
          label="名称"
          required
          validateStatus={submitted && !name.trim() ? "error" : undefined}
          help={submitted && !name.trim() ? "请输入 VPC 名称" : undefined}
        >
          <Input
            value={name}
            onChange={setName}
            placeholder="请输入 VPC 名称"
            maxLength={64}
            showWordLimit
            disabled={create.isPending}
          />
        </Form.Item>
        <VpcCidrField
          value={cidr}
          onChange={setCidr}
          cidrs={cidrs}
          loading={presets.isFetching}
          disabled={create.isPending}
          submitted={submitted}
          onOpen={() => {
            presets.refetch({ cancelRefetch: false });
          }}
        />
      </Form>
    </Modal>
  );
}
