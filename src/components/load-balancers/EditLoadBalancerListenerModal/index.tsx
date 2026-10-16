import { listenerInput } from "@/lib/load-balancers";
import { Form, Modal } from "@arco-design/web-react";
import LoadBalancerListenerForm, {
  type LoadBalancerListenerValues,
} from "@/components/load-balancers/LoadBalancerListenerForm";
import { validateForm } from "@/lib/form";

export default function EditLoadBalancerListenerModal({
  listener,
  usedPorts,
  onCancel,
  onSave,
}: {
  listener: LoadBalancerListenerValues;
  usedPorts: number[];
  onCancel: () => void;
  onSave: (listener: LoadBalancerListenerValues) => void;
}) {
  const [form] = Form.useForm<LoadBalancerListenerValues>();
  return (
    <Modal
      visible
      style={{ width: 760 }}
      title="编辑监听器"
      okText="保存"
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<LoadBalancerListenerValues>(form);
        onSave(listenerInput({ ...listener, ...values }));
      }}
    >
      <LoadBalancerListenerForm form={form} usedPorts={usedPorts} initialValues={listener} />
    </Modal>
  );
}
