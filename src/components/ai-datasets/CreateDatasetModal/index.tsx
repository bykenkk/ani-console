import { useRef } from "react";
import { Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDataset } from "@/api/modeldev";
import { validateForm } from "@/lib/form";
import DatasetMetadataFields from "../DatasetMetadataFields";

type CreateDatasetModalProps = { onCancel: () => void };
type CreateDatasetFormValues = { name: string; description?: string };

export default function CreateDatasetModal({ onCancel }: CreateDatasetModalProps) {
  const [form] = Form.useForm<CreateDatasetFormValues>();
  const submitting = useRef(false);
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (values: CreateDatasetFormValues) =>
      createDataset({
        name: values.name,
        ...(values.description ? { description: values.description } : {}),
      }),
    meta: { feedback: { channel: "message", action: "创建数据集", successText: "数据集已创建" } },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["datasets"] });
      onCancel();
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await create.mutateAsync(await validateForm<CreateDatasetFormValues>(form));
    } catch {
      // 表单校验和 mutation meta 统一反馈，保留输入供修正。
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible
      title="创建数据集"
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={create.isPending}
    >
      <Form form={form} layout="vertical" disabled={create.isPending}>
        <DatasetMetadataFields />
      </Form>
    </Modal>
  );
}
