import type {
  SandboxConfig,
  SandboxNetworkEgressPolicy,
  SandboxTemplate as ApiSandboxTemplate,
} from "@/api/instances/legacy";
import type { CpuInstanceComputeSpec } from "@/lib/instances";
import type { InstancePreset } from "@/api/instances";
import { createSandbox } from "@/api/sandboxes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, InputNumber, Modal } from "@arco-design/web-react";
import PresetSelect from "@/components/instances/InstanceComputeSelect/PresetSelect";
import { validateForm } from "@/lib/form";

// TODO(sandbox-legacy): 旧模板向导及其类型仅作迁移参考，新资源不调用旧实例接口。
export type SandboxTemplate = ApiSandboxTemplate;

type EgressPolicy = SandboxNetworkEgressPolicy;

export type SandboxCreateFormValues = {
  name: string;
  template_id: string;
  compute_spec: CpuInstanceComputeSpec;
  session_timeout: string;
  idle_timeout: string;
  on_timeout: NonNullable<SandboxConfig["on_timeout"]>;
  egress_policy: EgressPolicy;
  egress_allowlist: string;
  auto_start: boolean;
};

type SandboxCreateModalProps = { onCancel: () => void; onCreated: () => void };
type CreateSandboxFormValues = {
  name: string;
  image_reference: string;
  preset?: InstancePreset;
  workspace_size_gib: number;
};

export default function SandboxCreateModal({ onCancel, onCreated }: SandboxCreateModalProps) {
  const [form] = Form.useForm<CreateSandboxFormValues>();
  const qc = useQueryClient();
  const create = useMutation({
    mutationKey: ["sandbox-write", "create"],
    mutationFn: createSandbox,
    meta: { feedback: { channel: "message", action: "创建沙箱", successText: "创建沙箱已提交" } },
    onSuccess: async () => {
      // TODO(sandbox-task): 创建操作跟踪暂缓，受理后刷新列表，由手动刷新观察后续状态。
      await qc.invalidateQueries({ queryKey: ["sandboxes", "list"] });
      onCreated();
    },
  });
  const submit = async () => {
    if (create.isPending) return;
    try {
      const values = await validateForm<CreateSandboxFormValues>(form);
      if (!values.preset) return;
      await create.mutateAsync({
        name: values.name.trim(),
        image_reference: values.image_reference.trim(),
        preset_id: values.preset.id,
        workspace_size: `${values.workspace_size_gib}Gi`,
      });
    } catch {
      /* 表单校验及 mutation 统一反馈。 */
    }
  };
  return (
    <Modal
      visible
      title="创建沙箱"
      style={{ width: 640 }}
      onCancel={() => {
        if (!create.isPending) onCancel();
      }}
      onOk={submit}
      confirmLoading={create.isPending}
    >
      <Form<CreateSandboxFormValues>
        form={form}
        layout="vertical"
        disabled={create.isPending}
        initialValues={{ name: "", image_reference: "", workspace_size_gib: 5 }}
      >
        <Form.Item
          field="name"
          label="名称"
          rules={[{ required: true, message: "请输入沙箱名称" }]}
        >
          <Input maxLength={80} placeholder="沙箱名称" />
        </Form.Item>
        <Form.Item
          field="image_reference"
          label="镜像引用"
          extra="填写已登记且有拉取权限的 Linux amd64 镜像引用。"
          rules={[{ required: true, message: "请输入镜像引用" }]}
        >
          <Input placeholder="registry.example/project/image:tag" />
        </Form.Item>
        <Form.Item
          field="preset"
          label="CPU 算力规格"
          rules={[
            { required: true, message: "请选择 CPU 算力规格" },
            {
              validator: (preset: InstancePreset | undefined, cb) =>
                cb(
                  preset && (!preset.enabled || !preset.selectable || preset.compute_type !== "cpu")
                    ? "请选择可用的 CPU 算力规格"
                    : undefined,
                ),
            },
          ]}
        >
          <PresetSelect usage="SANDBOX" computeType="cpu" />
        </Form.Item>
        <Form.Item
          field="workspace_size_gib"
          label="工作区容量 (GiB)"
          extra="工作区挂载到 /workspace。暂停保留文件，销毁时删除工作区数据。"
          rules={[{ required: true, message: "请输入工作区容量" }]}
        >
          <InputNumber min={1} precision={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
