import { Descriptions, Empty, Modal, Spin, Tag, Typography } from "@arco-design/web-react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { getDatasetInputVersion, getDatasetPreview, type DatasetVersion } from "@/api/modeldev";
import { ResourceIdentity } from "@/components/common";
import {
  DATASET_PROVIDER_LABELS,
  DATASET_SOURCE_LOCK_LABELS,
  DATASET_VERSION_STATE_LABELS,
} from "@/lib/datasets";
import { formatDateTime } from "@/lib/format";
import { withId } from "@/lib/id";

type DatasetVersionDetailModalProps = { version: DatasetVersion; onCancel: () => void };
const SAMPLE_FIELDS = [
  { key: "instruction", label: "任务指令" },
  { key: "input", label: "输入上下文" },
  { key: "output", label: "参考回答" },
] as const;

export default function DatasetVersionDetailModal({
  version,
  onCancel,
}: DatasetVersionDetailModalProps) {
  const input = useQuery({
    queryKey: ["dataset-input-version", version.input_version_id],
    queryFn: ({ signal }) => getDatasetInputVersion(version.input_version_id, signal),
    meta: {
      errorNotification: {
        id: withId("dataset-input-version", version.input_version_id),
        action: "数据集版本详情加载",
      },
    },
  });
  const preview = useQuery({
    queryKey: ["dataset-preview", version.input_version_id],
    queryFn: version.preview_available
      ? ({ signal }) => getDatasetPreview(version.input_version_id, signal)
      : skipToken,
    meta: {
      errorNotification: {
        id: withId("dataset-preview", version.input_version_id),
        action: "数据集样本加载",
      },
    },
  });
  const source = version.source?.selection;
  return (
    <Modal
      visible
      title={`数据集版本 ${version.version_number}`}
      onCancel={onCancel}
      footer={null}
      style={{ width: 900 }}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        <Spin loading={input.isFetching} className="w-full">
          <Descriptions
            column={1}
            data={[
              {
                label: "版本 ID",
                value: <ResourceIdentity display="id" id={version.input_version_id} />,
              },
              { label: "数据格式", value: input.data?.format || "-" },
              {
                label: "版本状态",
                value: input.data
                  ? (DATASET_VERSION_STATE_LABELS[input.data.state] ?? input.data.state)
                  : "-",
              },
              { label: "样本数量", value: input.data?.row_count ?? "-" },
              { label: "数据大小（B）", value: input.data?.size_bytes ?? "-" },
              {
                label: "文件校验和（SHA-256）",
                value: <span className="break-all">{input.data?.sha256 || "-"}</span>,
              },
              { label: "发布时间", value: formatDateTime(version.published_at) },
              { label: "来源平台", value: source ? DATASET_PROVIDER_LABELS[source.provider] : "-" },
              { label: "数据源仓库", value: source?.repo_id || "-" },
              { label: "数据文件路径", value: source?.file_path || "-" },
              { label: "源仓库版本", value: source?.requested_revision || "-" },
              {
                label: "来源校验方式",
                value: source ? DATASET_SOURCE_LOCK_LABELS[source.lock_kind] : "-",
              },
              { label: "实际提交版本", value: source?.resolved_revision || "-" },
              {
                label: "来源快照校验和（SHA-256）",
                value: <span className="break-all">{version.source?.snapshot_sha256 || "-"}</span>,
              },
            ]}
          />
        </Spin>
        <Typography.Title heading={6}>样本预览</Typography.Title>
        {!version.preview_available ? (
          <Empty description="此版本未提供样本预览" />
        ) : (
          <Spin loading={preview.isFetching} className="w-full">
            {preview.data && (
              <Typography.Paragraph type="secondary">
                {preview.data.preview_truncated
                  ? `仅展示前 ${preview.data.records.length} 条样本；数据集共 ${preview.data.total_rows} 条样本。`
                  : `数据集共 ${preview.data.total_rows} 条样本。`}
              </Typography.Paragraph>
            )}
            {preview.data?.records.length ? (
              preview.data.records.map((record) => (
                <section
                  key={record.sample_index}
                  className="mb-4 rounded border border-solid border-(--color-border-2) p-4"
                >
                  <Typography.Title heading={6}>样本 {record.sample_index}</Typography.Title>
                  {SAMPLE_FIELDS.map(({ key, label }) => (
                    <div key={key} className="mb-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Typography.Text bold>{label}</Typography.Text>
                        {record.truncated_fields.includes(key) && <Tag>展示已省略</Tag>}
                      </div>
                      <Typography.Paragraph
                        className="break-words whitespace-pre-wrap"
                        ellipsis={{ rows: 4, expandable: true }}
                      >
                        {record[key] || "-"}
                      </Typography.Paragraph>
                    </div>
                  ))}
                </section>
              ))
            ) : (
              <Empty />
            )}
          </Spin>
        )}
      </div>
    </Modal>
  );
}
