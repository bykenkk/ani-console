import { Checkbox, Form, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  detachInstancePvc,
  getInstance,
  getInstanceConfiguration,
  type InstanceRecord,
} from "@/api/instances";
import { ApiError } from "@/api/request";
import { instanceIntentUnavailable } from "@/lib/instances";
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
  const qc = useQueryClient();
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
  const mutation = useMutation({
    mutationKey: ["instance-command", instance.id, "detach-pvc"],
    retry: false,
    mutationFn: async (input: InstanceDetachPvcFormValues) => {
      const latest = await getInstance(instance.id);
      if (latest.activeOperationId || latest.desiredState === "deleted") {
        throw new Error("实例已有进行中的操作或正在删除，请刷新后确认");
      }
      try {
        await detachInstancePvc(instance.id, { ...input, expectedVersion: latest.version });
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === "INSTANCE_VERSION_CONFLICT") {
            error.message = "实例版本已变化，请重新打开操作并确认";
          } else if (error.status === 503 && error.code === "INSTANCE_ACTION_UNAVAILABLE") {
            error.message = "当前环境暂未开放此操作";
          } else if (error.code === "INSTANCE_OPERATION_IN_PROGRESS") {
            error.message = "实例已有进行中的操作，请等待完成后再操作";
          } else if (error.code === "INSTANCE_REQUIRES_STOP") {
            error.message = "实例正在运行，请确认允许重启后再提交";
          }
        }
        throw error;
      }
    },
    meta: {
      feedback: {
        channel: "message",
        action: "卸载云盘",
        successText: "卸载云盘已提交",
        errorFallback: "卸载云盘失败，请稍后重试",
      },
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance", instance.id] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-configuration", instance.id] }),
      ]);
      onSubmitted();
    },
  });
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
