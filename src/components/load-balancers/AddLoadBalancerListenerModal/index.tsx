import { listenerInput } from "@/lib/load-balancers";
import { Form, Modal } from "@arco-design/web-react";
import type { LoadBalancerListenerFormValues } from "@/components/load-balancers/LoadBalancerListenerForm";
import LoadBalancerListenerForm from "@/components/load-balancers/LoadBalancerListenerForm";
import { validateForm } from "@/lib/form";

type AddLoadBalancerListenerModalProps = {
  usedPorts: number[];
  vpcId: string;
  pending?: boolean;
  onCancel: () => void;
  onAdd: (listener: LoadBalancerListenerFormValues) => void | Promise<void>;
};

export default function AddLoadBalancerListenerModal({
  usedPorts,
  vpcId,
  pending,
  onCancel,
  onAdd,
}: AddLoadBalancerListenerModalProps) {
  const [form] = Form.useForm<LoadBalancerListenerFormValues>();
  return (
    <Modal
      visible
      confirmLoading={pending}
      closable={!pending}
      maskClosable={!pending}
      cancelButtonProps={{ disabled: pending }}
      style={{ width: 760 }}
      title="添加监听器"
      okText="添加"
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<LoadBalancerListenerFormValues>(form);
        await onAdd(listenerInput(values));
      }}
    >
      <LoadBalancerListenerForm
        form={form}
        disabled={pending}
        vpcId={vpcId}
        usedPorts={usedPorts}
      />
    </Modal>
  );
}
