// FIXME(governance-instance-create): 创建以新契约为准，不传旧资源/网络/存储配置或 preset_version。
// TODO(governance-instance-create): 后端开放配置管理后复核原表单组件，不将不支持的旧字段混入新请求。
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, Modal } from "@arco-design/web-react";
import { createInstance, type InstancePreset } from "@/api/instances";
import type { ImageRegistration } from "@/api/images";
import InstancePresetField from "@/components/instances/InstancePresetField";
import InstanceImageFields from "@/components/instances/InstanceImageFields";
import { validateForm } from "@/lib/form";
import { showMessage } from "@/lib/feedback";

type GpuContainerCreateModalProps = {
  onCancel: () => void;
  onCreated: () => void;
};

type GpuContainerCreateFormValues = { name: string; preset_id: string; image_id: string };
export default function GpuContainerCreateModal({
  onCancel,
  onCreated,
}: GpuContainerCreateModalProps) {
  const [form] = Form.useForm<GpuContainerCreateFormValues>();
  const [preset, setPreset] = useState<InstancePreset>();
  const [image, setImage] = useState<ImageRegistration>();
  const submitting = useRef(false);
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: createInstance,
    meta: {
      feedback: {
        channel: "message",
        action: "创建 GPU 容器",
        successText: "创建已提交",
        errorFallback: "创建失败，请检查配置后重试",
      },
    },
    // TODO(container-task): 创建任务跟踪后续统一接入，当前仅提交请求并提示。
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["legacy-instances"] }),
      ]);
      onCreated();
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const values = await validateForm<GpuContainerCreateFormValues>(form);
      if (
        !preset ||
        preset.compute_type !== "gpu" ||
        !preset.enabled ||
        !preset.selectable ||
        preset.id !== values.preset_id ||
        !image ||
        image.image_id !== values.image_id
      ) {
        showMessage({ type: "error", content: "镜像或预设已变化，请重新选择" });
        return;
      }
      await create.mutateAsync({
        name: values.name.trim(),
        image_id: image.image_id,
        image_scope: image.scope,
        preset_id: preset.id,
      });
    } catch {
      /* 字段校验和 mutation feedback 负责提示。 */
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible
      title="创建 GPU 容器"
      confirmLoading={create.isPending}
      onOk={submit}
      onCancel={() => {
        if (!submitting.current) onCancel();
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          field="name"
          label="名称"
          rules={[
            { required: true, message: "请输入实例名称" },
            {
              validator: (value, callback) =>
                callback(typeof value === "string" && value.trim() ? undefined : "请输入实例名称"),
            },
          ]}
        >
          <Input maxLength={80} />
        </Form.Item>
        <InstancePresetField computeType="gpu" onChange={setPreset} />
        <InstanceImageFields
          onChange={(selected) => {
            setImage(selected);
            form.setFieldsValue({ image_id: selected?.image_id });
          }}
        />
      </Form>
    </Modal>
  );
}
