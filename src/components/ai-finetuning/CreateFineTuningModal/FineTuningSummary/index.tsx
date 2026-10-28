import type { CreateFineTuningFormValues } from "../index";
import type { ModelDevImplementation, ModelDevInputVersion } from "@/api/modeldev";
import type { InstancePreset } from "@/api/instances";
import type { Model, ModelVersion } from "@/api/models";
import ModelDevSummary from "@/components/ai-training/ModelDevSummary";
import { formatModelDevComputeResources, formatModelDevInputVersion } from "@/lib/modeldev";
import { formatDateTime } from "@/lib/format";
import { REGISTRATION_OPTIONS } from "../constants";

type FineTuningSummaryProps = {
  values: CreateFineTuningFormValues;
  computePreset?: InstancePreset;
  implementation?: ModelDevImplementation;
  baseVersion?: ModelVersion;
  baseModel?: Model;
  targetModel?: Model;
  inputVersion?: ModelDevInputVersion;
};

export default function FineTuningSummary({
  values,
  computePreset,
  implementation,
  baseVersion,
  baseModel,
  targetModel,
  inputVersion,
}: FineTuningSummaryProps) {
  const basicInfo = [
    { label: "名称", value: values.name },
    {
      label: "模型",
      value: baseModel?.name || values.baseModelId || "-",
    },
    {
      label: "模型版本",
      value: baseVersion
        ? `${baseVersion.version} · ${formatDateTime(baseVersion.created_at)}`
        : values.baseModelVersionId || "-",
    },
    { label: "算力类型", value: computePreset?.compute_type.toUpperCase() ?? "-" },
    { label: "算力规格", value: computePreset?.name ?? "-" },
    { label: "资源配置", value: formatModelDevComputeResources(computePreset) },
    { label: "微调技术", value: implementation?.name ?? "-" },
    {
      label: "数据集版本",
      value: inputVersion ? formatModelDevInputVersion(inputVersion) : values.dataset || "-",
    },
    {
      label: "训练结果登记",
      value:
        REGISTRATION_OPTIONS.find((item) => item.value === values.registrationMode)?.label ?? "-",
    },
  ];
  if (values.registrationMode === "existing") {
    basicInfo.push({
      label: "目标模型",
      value: targetModel?.name || values.targetModelId || "-",
    });
  } else if (values.registrationMode === "new") {
    basicInfo.push({ label: "新模型名称", value: values.newModelName || "-" });
  }
  return (
    <ModelDevSummary
      basicInfo={basicInfo}
      implementation={implementation}
      parameters={values.parameters}
    />
  );
}
