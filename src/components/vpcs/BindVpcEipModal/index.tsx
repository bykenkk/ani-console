import { Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bindNetworkVpcSnat, type BindNetworkSnatInput, type NetworkVPC } from "@/api/network";
import PublicIpSelect from "@/components/network/PublicIpSelect";
import { validateForm } from "@/lib/form";

type BindVpcEipModalProps = {
  vpc: NetworkVPC;
  onCancel: () => void;
  onSubmitted: () => void;
};

type BindVpcEipFormValues = {
  eipId: string;
};

export default function BindVpcEipModal({ vpc, onCancel, onSubmitted }: BindVpcEipModalProps) {
  const [form] = Form.useForm<BindVpcEipFormValues>();
  const queryClient = useQueryClient();
  // TODO: 部署后验证绑定状态、独占冲突、失败重试及重复提交的幂等行为。
  const bind = useMutation({
    mutationKey: ["vpc-eip-bind", vpc.id],
    mutationFn: (input: BindNetworkSnatInput) => bindNetworkVpcSnat(vpc.id, input),
    meta: {
      feedback: {
        channel: "message",
        action: "绑定公网 IP",
        successText: "公网 IP 绑定已提交",
        errorFallback: "绑定失败，请稍后重试",
      },
    },
    onSuccess: async (_, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["network-vpcs"] }),
        queryClient.invalidateQueries({ queryKey: ["network-vpc", vpc.id] }),
        queryClient.invalidateQueries({ queryKey: ["network-eips"] }),
        queryClient.invalidateQueries({ queryKey: ["network-eip", input.eip_id] }),
      ]);
      onSubmitted();
    },
  });

  return (
    <Modal
      visible
      title={`绑定公网 IP · ${vpc.name}`}
      okText="绑定"
      onCancel={onCancel}
      confirmLoading={bind.isPending}
      closable={!bind.isPending}
      maskClosable={!bind.isPending}
      escToExit={!bind.isPending}
      cancelButtonProps={{ disabled: bind.isPending }}
      onOk={async () => {
        if (bind.isPending) return;
        const values = await validateForm<BindVpcEipFormValues>(form);
        await bind.mutateAsync({ eip_id: values.eipId.trim() });
      }}
    >
      <Form form={form} layout="vertical" disabled={bind.isPending}>
        <Form.Item
          label="公网 IP"
          field="eipId"
          rules={[{ required: true, message: "请选择公网 IP" }]}
        >
          <PublicIpSelect disabled={bind.isPending} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
