import { Checkbox, Form, Modal, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { detachInstancePvc, getInstanceConfiguration, type InstanceRecord } from "@/api/instances";
import {
  useInstanceCommandMutation,
  instanceIntentUnavailable,
} from "@/hooks/useInstanceCommandMutation";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";

type InstanceDetachPvcModalProps = {
  instance: InstanceRecord;
  mountPath?: string;
  onCancel: () => void;
  onSubmitted: () => void;
};
type InstanceDetachPvcFormValues = { mount_path: string; restart_if_running: boolean };

export default function InstanceDetachPvcModal({
  instance,
  mountPath,
  onCancel,
  onSubmitted,
}: InstanceDetachPvcModalProps) {
  const [form] = Form.useForm<InstanceDetachPvcFormValues>();
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
  const mutation = useInstanceCommandMutation<InstanceDetachPvcFormValues>(
    instance.id,
    "detach-pvc",
    "卸载云盘",
    "message",
    (input: InstanceDetachPvcFormValues & { expectedVersion: string }) =>
      detachInstancePvc(instance.id, input),
    onSubmitted,
  );
  const running = instance.observedState === "running";
  const disabled =
    !configuration.data ||
    configuration.isFetching ||
    Boolean(configuration.data.pending_change) ||
    instanceIntentUnavailable(instance);
  return (
    <Modal
      visible
      title={`卸载云盘 · ${instance.name}`}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled }}
      onCancel={() => {
        if (!mutation.isPending) onCancel();
      }}
      onOk={async () => {
        if (disabled) return;
        const values = await validateForm<InstanceDetachPvcFormValues>(form);
        mutation.mutate({
          mount_path: values.mount_path,
          restart_if_running: values.restart_if_running,
        });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ mount_path: mountPath, restart_if_running: false }}
      >
        <Form.Item
          field="mount_path"
          label="挂载点"
          extra="仅移除挂载，不删除 PVC 或其中的数据。"
          rules={[
            { required: true, message: "请选择挂载点" },
            {
              validator: (value, callback) =>
                callback(
                  configuration.data?.volume_mounts.some(
                    (mount) =>
                      mount.mount_path === value &&
                      value !== configuration.data.workspace_mount_path,
                  )
                    ? undefined
                    : "请选择当前附加挂载点，工作目录不可卸载",
                ),
            },
          ]}
        >
          <Select
            placeholder="请选择要卸载的挂载点"
            options={(configuration.data?.volume_mounts ?? []).map((mount) => ({
              value: mount.mount_path,
              label: `${mount.pvc_name} · ${mount.mount_path}`,
              disabled: mount.mount_path === configuration.data?.workspace_mount_path,
            }))}
          />
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
