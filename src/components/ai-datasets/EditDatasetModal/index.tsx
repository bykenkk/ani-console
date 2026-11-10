import { useRef, useState } from "react";
import { Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getDataset, updateDataset, type Dataset, type UpdateDatasetInput } from "@/api/modeldev";
import { ApiError } from "@/api/request";
import { validateForm } from "@/lib/form";
import { showMessage } from "@/lib/feedback";
import { withId } from "@/lib/id";
import DatasetMetadataFields from "../DatasetMetadataFields";

type EditDatasetModalProps = { dataset: Dataset; onCancel: () => void };
type EditDatasetFormValues = { name: string; description: string };

export default function EditDatasetModal({ dataset, onCancel }: EditDatasetModalProps) {
  const [form] = Form.useForm<EditDatasetFormValues>();
  const [revision, setRevision] = useState(dataset.revision);
  const submitting = useRef(false);
  const qc = useQueryClient();
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["datasets"] }),
      qc.invalidateQueries({ queryKey: ["dataset", dataset.dataset_id] }),
      qc.invalidateQueries({ queryKey: ["dataset-versions", dataset.dataset_id] }),
      qc.invalidateQueries({ queryKey: ["dataset-operations", dataset.dataset_id] }),
    ]);
  const update = useMutation({
    mutationFn: (input: UpdateDatasetInput) => updateDataset(dataset.dataset_id, input),
    meta: { feedback: { channel: "message", action: "保存数据集", successText: "数据集已保存" } },
    onSuccess: async () => {
      await refresh();
      onCancel();
    },
    onError: async (error) => {
      if (!(error instanceof ApiError) || error.status !== 409 || error.code !== "COMMAND_CONFLICT")
        return;
      await refresh();
      try {
        const response = await qc.fetchQuery({
          queryKey: ["dataset", dataset.dataset_id],
          queryFn: ({ signal }) => getDataset(dataset.dataset_id, signal),
          staleTime: 0,
          meta: {
            errorNotification: {
              id: withId("dataset", dataset.dataset_id),
              action: "数据集详情加载",
            },
          },
        });
        // 保留表单，不自动重新提交。
        setRevision(response.revision);
      } catch {
        // 刷新失败由查询反馈处理，保留原 revision，禁止猜测新值。
      }
    },
  });
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const values = await validateForm<EditDatasetFormValues>(form);
      // 与打开时的值比较，只提交用户改动；冲突刷新不把服务端其他字段覆盖回去。
      const name = values.name !== dataset.name ? values.name : undefined;
      const description =
        values.description !== dataset.description ? values.description : undefined;
      if (name === undefined && description === undefined) {
        showMessage({ type: "info", content: "没有需要保存的修改" });
        return;
      }
      await update.mutateAsync({
        expected_revision: revision,
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      });
    } catch {
      // 校验与提交错误使用统一反馈，保留表单。
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Modal
      visible
      title="编辑数据集"
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={update.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: dataset.name, description: dataset.description }}
        disabled={update.isPending}
      >
        <DatasetMetadataFields allowEmptyDescription={!dataset.description} />
      </Form>
    </Modal>
  );
}
