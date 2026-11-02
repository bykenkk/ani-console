import { listenerInput } from "@/lib/load-balancers";
import { Form, Modal } from "@arco-design/web-react";
import LoadBalancerListenerForm, {
  type LoadBalancerListenerFormValues,
} from "@/components/load-balancers/LoadBalancerListenerForm";
import { validateForm } from "@/lib/form";

type EditLoadBalancerListenerModalProps = {
  listener: LoadBalancerListenerFormValues;
  usedPorts: number[];
  vpcId: string;
  pending?: boolean;
  onCancel: () => void;
  onSave: (listener: LoadBalancerListenerFormValues) => void | Promise<void>;
};

export default function EditLoadBalancerListenerModal({
  listener,
  usedPorts,
  vpcId,
  pending,
  onCancel,
  onSave,
}: EditLoadBalancerListenerModalProps) {
  const [form] = Form.useForm<LoadBalancerListenerFormValues>();
  return (
    <Modal
      visible
      confirmLoading={pending}
      closable={!pending}
      maskClosable={!pending}
      cancelButtonProps={{ disabled: pending }}
      style={{ width: 760 }}
      title="编辑监听器"
      okText="保存"
      onCancel={onCancel}
      onOk={async () => {
        const values = await validateForm<LoadBalancerListenerFormValues>(form);
        await onSave(listenerInput({ ...listener, ...values }));
      }}
    >
      <LoadBalancerListenerForm
        form={form}
        disabled={pending}
        vpcId={vpcId}
        usedPorts={usedPorts}
        initialValues={listener}
      />
    </Modal>
  );
}
