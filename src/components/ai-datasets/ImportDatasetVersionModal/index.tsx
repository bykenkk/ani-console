import { useEffect, useRef, useState } from "react";
import { Alert, Button, Descriptions, Form, Input, Modal, Select } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  importDatasetVersion,
  inspectDatasetSource,
  type Dataset,
  type DatasetSourceProvider,
  type InspectDatasetSourceInput,
  type InspectDatasetSourceResponse,
} from "@/api/modeldev";
import { validateForm } from "@/lib/form";
import { showMessage } from "@/lib/feedback";
import { DATASET_PROVIDER_LABELS } from "@/lib/datasets";

type ImportDatasetVersionModalProps = { dataset: Dataset; onCancel: () => void };
type ImportDatasetVersionFormValues = {
  provider: DatasetSourceProvider;
  repo_id: string;
  revision: string;
  file_path: string;
};

export default function ImportDatasetVersionModal({
  dataset,
  onCancel,
}: ImportDatasetVersionModalProps) {
  const [form] = Form.useForm<ImportDatasetVersionFormValues>();
  const [inspection, setInspection] = useState<InspectDatasetSourceResponse>();
  const generation = useRef(0);
  const controller = useRef<AbortController>();
  const submitting = useRef(false);
  const qc = useQueryClient();
  useEffect(() => () => controller.current?.abort(), []);
  const inspect = useMutation({
    mutationFn: ({ source }: { source: InspectDatasetSourceInput; generation: number }) => {
      controller.current?.abort();
      controller.current = new AbortController();
      return inspectDatasetSource(source, controller.current.signal);
    },
    meta: {
      feedback: { channel: "message", action: "检查数据集来源", successText: "来源检查已完成" },
    },
    onSuccess: (result, input) => {
      if (input.generation === generation.current) setInspection(result);
    },
  });
  const submit = useMutation({
    mutationFn: () => {
      if (!inspection?.selection || !inspection.selection_fingerprint)
        throw new Error("请先检查来源文件");
      return importDatasetVersion(dataset.dataset_id, {
        source: inspection.selection,
        selection_fingerprint: inspection.selection_fingerprint,
      });
    },
    meta: { feedback: { channel: "message", action: "导入数据", successText: "导入已提交" } },
    onSuccess: async () => {
      // TODO(dataset-import-tracking): 后续接入导入任务列表、详情、终态跟踪、取消和重试；当前仅刷新资源查询。
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["datasets"] }),
        qc.invalidateQueries({ queryKey: ["dataset", dataset.dataset_id] }),
        qc.invalidateQueries({ queryKey: ["dataset-versions", dataset.dataset_id] }),
        qc.invalidateQueries({ queryKey: ["dataset-operations", dataset.dataset_id] }),
      ]);
      onCancel();
    },
  });
  const checkSource = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const source = await validateForm<ImportDatasetVersionFormValues>(form);
      setInspection(undefined);
      await inspect.mutateAsync({ source, generation: generation.current });
    } catch {
      // 表单与检查错误统一反馈。
    } finally {
      submitting.current = false;
    }
  };
  const importVersion = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await validateForm(form);
      if (!inspection?.selection || !inspection.selection_fingerprint) {
        showMessage({ type: "error", content: "请先检查来源文件" });
        return;
      }
      await submit.mutateAsync();
    } catch {
      // 提交失败保留已检查来源与表单，重复意图由公共幂等层处理。
    } finally {
      submitting.current = false;
    }
  };
  const busy = inspect.isPending || submit.isPending;
  return (
    <Modal
      visible
      title={`导入数据 · ${dataset.name}`}
      onCancel={onCancel}
      onOk={importVersion}
      okText="提交导入"
      confirmLoading={submit.isPending}
      okButtonProps={{ disabled: busy || !inspection?.selection }}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={busy}
        initialValues={{ provider: "MODELSCOPE", repo_id: "", revision: "", file_path: "" }}
        onValuesChange={() => {
          generation.current += 1;
          setInspection(undefined);
        }}
      >
        <Alert
          type="info"
          content="从外部仓库导入数据，成功后生成新的数据集版本。仅支持公开 HuggingFace / ModelScope 仓库中的 Alpaca JSON/JSONL 文件。来源检查通过后，内容仍需在导入时完整校验。"
          className="mb-4"
        />
        <Form.Item
          field="provider"
          label="来源平台"
          rules={[{ required: true, message: "请选择来源平台" }]}
        >
          <Select
            options={Object.entries(DATASET_PROVIDER_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
        <Form.Item
          field="repo_id"
          label="仓库"
          rules={[{ required: true, message: "请输入仓库 ID" }]}
        >
          <Input placeholder="组织/仓库" />
        </Form.Item>
        <Form.Item
          field="revision"
          label="Revision"
          rules={[{ required: true, message: "请输入分支、Tag 或 Commit" }]}
        >
          <Input placeholder="分支、Tag 或 Commit" />
        </Form.Item>
        <Form.Item
          field="file_path"
          label="文件路径"
          rules={[
            { required: true, message: "请输入仓库内的文件路径" },
            {
              validator: (value: string | undefined, callback) =>
                callback(
                  value && !/\.(json|jsonl)$/.test(value)
                    ? "仅支持 .json 或 .jsonl 文件"
                    : undefined,
                ),
            },
          ]}
        >
          <Input placeholder="仓库内的 .json 或 .jsonl 文件" />
        </Form.Item>
        <Button onClick={checkSource} loading={inspect.isPending} disabled={submit.isPending}>
          检查来源
        </Button>
        {inspection?.selection && (
          <Descriptions
            className="mt-4"
            column={1}
            data={[
              { label: "锁定方式", value: inspection.selection.lock_kind },
              { label: "大小", value: `${inspection.selection.expected_size_bytes} B` },
              { label: "解析版本", value: inspection.selection.resolved_revision || "-" },
              {
                label: "SHA-256",
                value: (
                  <span className="break-all">
                    {inspection.selection.expected_file_sha256 || "-"}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Form>
    </Modal>
  );
}
