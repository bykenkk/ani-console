import { Checkbox, Form, Input, Modal } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  attachInstancePvc,
  getInstance,
  getInstanceConfiguration,
  type InstanceRecord,
} from "@/api/instances";
import { ApiError } from "@/api/request";
import { instanceIntentUnavailable } from "@/lib/instances";
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
  const qc = useQueryClient();
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
  const mutation = useMutation({
    mutationKey: ["instance-command", instance.id, "attach-pvc"],
    retry: false,
    mutationFn: async (input: InstanceAttachPvcFormValues) => {
      const latest = await getInstance(instance.id);
      if (latest.activeOperationId || latest.desiredState === "deleted") {
        throw new Error("实例已有进行中的操作或正在删除，请刷新后确认");
      }
      try {
        await attachInstancePvc(instance.id, { ...input, expectedVersion: latest.version });
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
        action: "挂载云盘",
        successText: "挂载云盘已提交",
        errorFallback: "挂载云盘失败，请稍后重试",
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
