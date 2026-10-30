import { Checkbox, Form, Input, Modal } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { attachInstancePvc, getInstanceConfiguration, type InstanceRecord } from "@/api/instances";
import {
  useInstanceCommandMutation,
  instanceIntentUnavailable,
} from "@/hooks/useInstanceCommandMutation";
import InstancePvcSelect from "@/components/instances/InstancePvcSelect";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";
import { validatePvcMountPath } from "./utils";

type InstanceAttachPvcModalProps = {
  instance: InstanceRecord;
  onCancel: () => void;
  onSubmitted: () => void;
};
type InstanceAttachPvcFormValues = {
  pvc_name: string;
  mount_path: string;
  read_only: boolean;
  restart_if_running: boolean;
};

export default function InstanceAttachPvcModal({
  instance,
  onCancel,
  onSubmitted,
}: InstanceAttachPvcModalProps) {
  const [form] = Form.useForm<InstanceAttachPvcFormValues>();
  const configuration = useQuery({
    queryKey: ["governance-instance-configuration", instance.id],
    queryFn: ({ signal }) => getInstanceConfiguration(instance.id, signal),
    gcTime: 0,
    meta: {
      errorNotification: {
        id: withId("instance-configuration", instance.id),
        action: "实例配置加载",
      },
    },
  });
  const mutation = useInstanceCommandMutation<InstanceAttachPvcFormValues>(
    instance.id,
    "attach-pvc",
    "挂载云盘",
    "message",
    (input: InstanceAttachPvcFormValues & { expectedVersion: string }) =>
      attachInstancePvc(instance.id, input),
    onSubmitted,
  );
  const running = instance.observedState === "running";
  const disabled =
    !configuration.data ||
    configuration.isFetching ||
    Boolean(configuration.data.pending_change) ||
    configuration.data.volume_mounts.length >= 8 ||
    instanceIntentUnavailable(instance);
  return (
    <Modal
      visible
      title={`挂载云盘 · ${instance.name}`}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled }}
      onCancel={() => {
        if (!mutation.isPending) onCancel();
      }}
      onOk={async () => {
        if (disabled) return;
        const values = await validateForm<InstanceAttachPvcFormValues>(form);
        mutation.mutate({
          pvc_name: values.pvc_name,
          mount_path: values.mount_path,
          read_only: values.read_only,
          restart_if_running: values.restart_if_running,
        });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ read_only: false, restart_if_running: false }}
      >
        <Form.Item
          field="pvc_name"
          label="云盘（PVC）"
          rules={[{ required: true, message: "请选择 PVC" }]}
        >
          <InstancePvcSelect instanceId={instance.id} />
        </Form.Item>
        <Form.Item
          field="mount_path"
          label="挂载路径"
          rules={[
            { required: true, message: "请输入挂载路径" },
            {
              validator: (value, callback) =>
                callback(validatePvcMountPath(value ?? "", configuration.data)),
            },
          ]}
          extra={
            configuration.data?.volume_mounts.length === 8 ? "最多支持 8 个附加挂载" : undefined
          }
        >
          <Input placeholder="例如 /data" />
        </Form.Item>
        <Form.Item field="read_only" triggerPropName="checked">
          <Checkbox>只读挂载</Checkbox>
        </Form.Item>
        {running && (
          <Form.Item
            field="restart_if_running"
            triggerPropName="checked"
            rules={[
              {
                validator: (value, callback) =>
                  callback(value === true ? undefined : "请确认允许中断容器进程并重启"),
              },
            ]}
          >
            <Checkbox>
              允许重启：会中断容器进程和终端会话，内存及临时数据可能丢失，PVC 数据保留
            </Checkbox>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
