import type { ModelDevImplementation, ModelDevInputVersion } from "@/api/modeldev";
import type { InstancePreset } from "@/api/instances";
import ModelDevSummary from "@/components/ai-training/ModelDevSummary";
import { formatModelDevComputeResources, formatModelDevInputVersion } from "@/lib/modeldev";
import type { TrainingTaskCreateFormValues } from "../index";

type TrainingTaskSummaryProps = {
  values: TrainingTaskCreateFormValues;
  implementation?: ModelDevImplementation;
  computePreset?: InstancePreset;
  inputVersion?: ModelDevInputVersion;
};

export default function TrainingTaskSummary({
  values,
  implementation,
  computePreset,
  inputVersion,
}: TrainingTaskSummaryProps) {
  return (
    <ModelDevSummary
      basicInfo={[
        { label: "名称", value: values.name },
        { label: "算力类型", value: computePreset?.compute_type.toUpperCase() ?? "-" },
        { label: "算力规格", value: computePreset?.name ?? "-" },
        { label: "资源配置", value: formatModelDevComputeResources(computePreset) },
        { label: "训练方法", value: implementation?.name ?? "-" },
        {
          label: "数据集版本",
          value: inputVersion
            ? formatModelDevInputVersion(inputVersion)
            : values.dataset_version_id || "-",
        },
      ]}
      implementation={implementation}
      parameters={values.parameters}
    />
  );
}
