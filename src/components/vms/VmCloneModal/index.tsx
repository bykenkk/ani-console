import { Alert, Form, Input, Modal, Switch } from "@arco-design/web-react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/request";
import { cloneVm, getVm, type VirtualMachine } from "@/api/vms";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";
import { vmCloneIsPreparing, vmIsClosed } from "@/lib/vms";

type VmCloneModalProps = {
  vm: VirtualMachine;
  onCancel: () => void;
  onSubmitted: () => void;
};
type VmCloneFormValues = { name: string; startAfterCreate: boolean };

export default function VmCloneModal({ vm, onCancel, onSubmitted }: VmCloneModalProps) {
  const [form] = Form.useForm<VmCloneFormValues>();
  const client = useQueryClient();
  const pending = useIsMutating({ mutationKey: ["vm-write"] });
  const source = useQuery({
    queryKey: ["vms", vm.id],
    queryFn: ({ signal }) => getVm(vm.id, signal),
    refetchOnMount: "always",
    meta: { errorNotification: { id: withId("vm", vm.id), action: "源云主机加载" } },
  });
  const current = source.data ?? vm;
  const unavailable =
    !source.data ||
    source.isFetching ||
    source.isError ||
    vmIsClosed(current) ||
    vmCloneIsPreparing(current) ||
    !(Number(current.version) >= 1);
  const mutation = useMutation({
    mutationKey: ["vm-write", "clone", vm.id],
    retry: false,
    mutationFn: (values: VmCloneFormValues) =>
      cloneVm({
        name: values.name.trim(),
        source_vm_id: current.id,
        expected_source_version: Number(current.version),
        start_after_create: values.startAfterCreate,
      }),
    meta: { feedback: { channel: "message", action: "克隆云主机", successText: "创建已提交" } },
    onSuccess: async () => {
      // TODO(vm-task): 克隆创建任务跟踪统一暂缓，后续接入操作查询及轮询。
      onSubmitted();
      await Promise.all([
        client.invalidateQueries({ queryKey: ["vms", "list"] }),
        client.invalidateQueries({ queryKey: ["vms", vm.id], exact: true }),
      ]);
    },
    onError: async (error) => {
      if (
        error instanceof ApiError &&
        (error.code === "VM_VERSION_CONFLICT" || error.message === "VM_VERSION_CONFLICT")
      ) {
        await client.invalidateQueries({ queryKey: ["vms", vm.id], exact: true });
      }
    },
  });
  const busy = pending > 0;
  return (
    <Modal
      visible
      title={`克隆云主机 - ${current.name}`}
      okText="创建云主机"
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: busy || unavailable }}
      cancelButtonProps={{ disabled: busy }}
      maskClosable={!busy}
      closable={!busy}
      onCancel={() => {
        if (!busy) onCancel();
      }}
      onOk={async () => {
        if (busy || unavailable) return;
        await mutation.mutateAsync(await validateForm(form));
      }}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={busy}
        initialValues={{ startAfterCreate: false }}
      >
        <Alert
          className="mb-4"
          type="info"
          content="规格、磁盘、网络、DNS 和安全组继承源云主机，不支持覆盖；不会重新注入登录凭据。自动开机将在克隆登记完成后执行。"
        />
        <Form.Item
          field="name"
          label="新云主机名称"
          rules={[
            { required: true, message: "请输入新云主机名称" },
            { maxLength: 128 },
            {
              validator: (value, callback) =>
                callback(value?.trim() ? undefined : "请输入新云主机名称"),
            },
          ]}
        >
          <Input maxLength={128} placeholder="请输入新云主机名称" />
        </Form.Item>
        <Form.Item field="startAfterCreate" label="创建后自动开机" triggerPropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
