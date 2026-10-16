// FIXME(governance-migration): 目前只提交远端仓库导入并刷新列表，未接入导入任务进度/重试及本地文件上传。
// TODO(governance-migration): 接入 models/import-tasks 查询和重试；本地上传须先确认实际文件传输契约。
import { importModel, type ImportModelInput } from "@/api/models";
import { Form, Input, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { validateForm } from "@/lib/form";

export default function ImportModelModal({ onCancel }: { onCancel: () => void }) {
  const qc = useQueryClient();
  const [form] = Form.useForm<ImportModelInput>();
  const submitting = useRef(false);

  const submit = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "提交模型导入任务",
        successText: "模型导入已提交",
        errorFallback: "提交模型导入任务失败",
      },
    },
    mutationFn: (input: ImportModelInput) => importModel(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["governance-models"] });
      onCancel();
    },
  });
  const onSubmit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const values = await validateForm<ImportModelInput>(form);
      await submit.mutateAsync({
        source: values.source,
        repo_id: values.repo_id.trim(),
        revision: values.revision?.trim() || "main",
      });
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Modal
      visible
      title="导入模型"
      okText="开始导入"
      confirmLoading={submit.isPending}
      onCancel={onCancel}
      onOk={onSubmit}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ source: "huggingface", revision: "main" }}
      >
        <Form.Item field="source" label="来源" rules={[{ required: true, message: "请选择来源" }]}>
          <Select
            options={[
              { value: "huggingface", label: "HuggingFace" },
              { value: "modelscope", label: "ModelScope" },
            ]}
          />
        </Form.Item>
        <Form.Item
          field="repo_id"
          label="仓库 ID"
          rules={[
            { required: true, message: "请输入模型仓库 ID" },
            {
              validator: (value, callback) => {
                if (typeof value !== "string" || value.trim().length < 3)
                  callback("请输入有效的模型仓库 ID");
                else callback();
              },
            },
          ]}
        >
          <Input placeholder="例如 Qwen/Qwen2.5-7B-Instruct" maxLength={256} showWordLimit />
        </Form.Item>
        <Form.Item field="revision" label="版本 / Revision">
          <Input placeholder="main" maxLength={128} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
