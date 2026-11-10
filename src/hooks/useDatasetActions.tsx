import { useState } from "react";
import { Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveDataset, restoreDataset, type Dataset } from "@/api/modeldev";
import { ApiError } from "@/api/request";
import type { RowAction } from "@/components/common";
import EditDatasetModal from "@/components/ai-datasets/EditDatasetModal";
import ImportDatasetVersionModal from "@/components/ai-datasets/ImportDatasetVersionModal";

type DatasetLifecycleInput = { dataset: Dataset; archive: boolean };

export function useDatasetActions() {
  const qc = useQueryClient();
  const refresh = (datasetId: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["datasets"] }),
      qc.invalidateQueries({ queryKey: ["dataset", datasetId] }),
      qc.invalidateQueries({ queryKey: ["dataset-versions", datasetId] }),
      qc.invalidateQueries({ queryKey: ["dataset-operations", datasetId] }),
    ]);
  const [editing, setEditing] = useState<Dataset | null>(null);
  const [importing, setImporting] = useState<Dataset | null>(null);
  const lifecycle = useMutation({
    mutationFn: ({ dataset, archive }: DatasetLifecycleInput) =>
      (archive ? archiveDataset : restoreDataset)(dataset.dataset_id, {
        expected_revision: dataset.revision,
      }),
    meta: {
      feedback: (variables) => {
        const { archive } = variables as DatasetLifecycleInput;
        return {
          channel: "notification",
          id: "dataset-lifecycle",
          action: archive ? "归档数据集" : "恢复数据集",
          successText: archive ? "数据集已归档" : "数据集已恢复",
        };
      },
    },
    onSuccess: (_, { dataset }) => refresh(dataset.dataset_id),
    onError: (error, { dataset }) => {
      if (error instanceof ApiError && error.status === 409 && error.code === "COMMAND_CONFLICT")
        return refresh(dataset.dataset_id);
    },
  });
  const actions: RowAction<Dataset>[] = [
    {
      key: "edit",
      label: "编辑",
      disabled: (dataset) => dataset.state !== "ACTIVE",
      tooltip: (dataset) =>
        dataset.state !== "ACTIVE" ? "已归档的数据集只读，请先恢复后再编辑" : undefined,
      onClick: (dataset) => {
        if (dataset.state === "ACTIVE") setEditing(dataset);
      },
    },
    {
      key: "import",
      label: "导入数据",
      disabled: (dataset) => dataset.state !== "ACTIVE",
      tooltip: (dataset) =>
        dataset.state !== "ACTIVE" ? "已归档的数据集只读，请先恢复后再导入" : undefined,
      onClick: (dataset) => {
        if (dataset.state === "ACTIVE") setImporting(dataset);
      },
    },
    {
      key: "lifecycle",
      label: (dataset) => (dataset.state === "ACTIVE" ? "归档" : "恢复"),
      loading: (dataset) =>
        lifecycle.isPending && lifecycle.variables?.dataset.dataset_id === dataset.dataset_id,
      onClick: (dataset) => {
        const archive = dataset.state === "ACTIVE";
        Modal.confirm({
          title: archive ? "归档数据集" : "恢复数据集",
          content: archive
            ? `确定归档「${dataset.name}」？归档后不能提交新导入或使用该集合创建训练、微调任务，已发布版本仍保留。`
            : `确定恢复「${dataset.name}」？`,
          okButtonProps: archive ? { status: "warning" } : undefined,
          onOk: () => lifecycle.mutateAsync({ dataset, archive }),
        });
      },
    },
  ];
  return {
    actions,
    dialogNode: (
      <>
        {editing && <EditDatasetModal dataset={editing} onCancel={() => setEditing(null)} />}
        {importing && (
          <ImportDatasetVersionModal dataset={importing} onCancel={() => setImporting(null)} />
        )}
      </>
    ),
  };
}
