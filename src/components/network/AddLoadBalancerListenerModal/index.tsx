import { listenerInput } from "@/lib/load-balancers";
import { Form, Modal } from "@arco-design/web-react";
import type { LoadBalancerListenerValues } from "@/components/network/LoadBalancerListenerForm";
import LoadBalancerListenerForm from "@/components/network/LoadBalancerListenerForm";
import { validateForm } from "@/lib/form";

export default function AddLoadBalancerListenerModal({
  usedPorts,
  onCancel,
  onAdd,
}: {
  usedPorts: number[];
  onCancel: () => void;
  onAdd: (listener: LoadBalancerListenerValues) => void;
}) {
  const [form] = Form.useForm<LoadBalancerListenerValues>();
  return (
    <Modal
      visible
      style={{ width: 760 }}
      title="添加监听器"
      okText="添加"
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<LoadBalancerListenerValues>(form);
        onAdd(listenerInput({ ...values, backends: [] }));
      }}
    >
      <LoadBalancerListenerForm form={form} usedPorts={usedPorts} />
    </Modal>
  );
}
