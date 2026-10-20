import { listenerInput } from "@/lib/load-balancers";
import { Form, Modal } from "@arco-design/web-react";
import LoadBalancerListenerForm, {
  type LoadBalancerListenerFormValues,
} from "@/components/load-balancers/LoadBalancerListenerForm";
import { validateForm } from "@/lib/form";

type EditLoadBalancerListenerModalProps = {
  listener: LoadBalancerListenerFormValues;
  usedPorts: number[];
  onCancel: () => void;
  onSave: (listener: LoadBalancerListenerFormValues) => void;
};

export default function EditLoadBalancerListenerModal({
  listener,
  usedPorts,
  onCancel,
  onSave,
}: EditLoadBalancerListenerModalProps) {
  const [form] = Form.useForm<LoadBalancerListenerFormValues>();
  return (
    <Modal
      visible
      style={{ width: 760 }}
      title="编辑监听器"
      okText="保存"
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<LoadBalancerListenerFormValues>(form);
        onSave(listenerInput({ ...listener, ...values }));
      }}
    >
      <LoadBalancerListenerForm form={form} usedPorts={usedPorts} initialValues={listener} />
    </Modal>
  );
}
