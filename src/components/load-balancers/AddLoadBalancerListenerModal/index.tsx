import { listenerInput } from "@/lib/load-balancers";
import { Form, Modal } from "@arco-design/web-react";
import type { LoadBalancerListenerFormValues } from "@/components/load-balancers/LoadBalancerListenerForm";
import LoadBalancerListenerForm from "@/components/load-balancers/LoadBalancerListenerForm";
import { validateForm } from "@/lib/form";

type AddLoadBalancerListenerModalProps = {
  usedPorts: number[];
  onCancel: () => void;
  onAdd: (listener: LoadBalancerListenerFormValues) => void;
};

export default function AddLoadBalancerListenerModal({
  usedPorts,
  onCancel,
  onAdd,
}: AddLoadBalancerListenerModalProps) {
  const [form] = Form.useForm<LoadBalancerListenerFormValues>();
  return (
    <Modal
      visible
      style={{ width: 760 }}
      title="添加监听器"
      okText="添加"
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<LoadBalancerListenerFormValues>(form);
        onAdd(listenerInput({ ...values, backends: [] }));
      }}
    >
      <LoadBalancerListenerForm form={form} usedPorts={usedPorts} />
    </Modal>
  );
}
