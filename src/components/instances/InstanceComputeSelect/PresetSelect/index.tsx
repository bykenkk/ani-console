import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, Tooltip } from "@arco-design/web-react";
import { IconExclamationCircle } from "@arco-design/web-react/icon";
import { listInstancePresets, type ComputeType, type InstancePreset } from "@/api/instances";
import { listInferencePresets } from "@/api/inference";
import { listModelDevComputePresets } from "@/api/modeldev";
import { withId } from "@/lib/id";
import { withFirst100 } from "@/api/pagination";
import { closeNotification, showNotification } from "@/lib/feedback";

export type PresetSelectProps = {
  usage?: "CONTAINER_INSTANCE" | "INFERENCE" | "TRAINING";
  computeType?: ComputeType;
  value?: InstancePreset;
  onChange?: (preset?: InstancePreset) => void;
  disabled?: boolean;
};

const listPresetOptions = withFirst100(listInstancePresets);
const listInferencePresetOptions = withFirst100(listInferencePresets);
const listTrainingPresetOptions = withFirst100(listModelDevComputePresets);
const listOptionsByUsage = {
  CONTAINER_INSTANCE: listPresetOptions,
  INFERENCE: listInferencePresetOptions,
  TRAINING: listTrainingPresetOptions,
};

export default function PresetSelect({
  usage = "CONTAINER_INSTANCE",
  computeType,
  value,
  onChange,
  disabled,
}: PresetSelectProps) {
  const label =
    usage === "INFERENCE" ? "推理算力规格" : usage === "TRAINING" ? "算力规格" : "实例预设";
  const scope = `${usage}-${computeType ?? "all"}`;
  const query = useQuery({
    queryKey: ["compute-presets", usage, computeType, "options"],
    queryFn: ({ signal }) => listOptionsByUsage[usage]({ compute_type: computeType }, signal),
    meta: {
      errorNotification: { id: withId("compute-presets", scope), action: `${label}加载` },
    },
  });
  const catalogStatus = query.data?.gpu_catalog_status;
  useEffect(() => {
    const id = withId("compute-preset-gpu-catalog", scope);
    if (catalogStatus === "OK") {
      closeNotification(id);
    } else if (catalogStatus === "NO_PERMISSION" || catalogStatus === "UNAVAILABLE") {
      showNotification({
        id,
        state: "error",
        action: `加载 GPU ${label}`,
        content:
          catalogStatus === "NO_PERMISSION"
            ? `当前账号无权查看 GPU ${label}`
            : `GPU ${label}暂不可用，请稍后重试`,
      });
    }
  }, [catalogStatus, scope, label, query.dataUpdatedAt]);
  useEffect(() => {
    const current = query.data?.items.find((item) => item.id === value?.id);
    if (query.data && value && !current) {
      onChange?.(undefined);
      return;
    }
    // 候选刷新后同步可选状态，使调用方按表单当前值执行校验。
    if (
      value &&
      current &&
      (current.enabled !== value.enabled ||
        current.selectable !== value.selectable ||
        current.compute_type !== value.compute_type)
    )
      onChange?.(current);
  }, [query.data, value, onChange]);
  const items = query.data?.items ?? [];
  const options = value && !items.some((item) => item.id === value.id) ? [value, ...items] : items;
  return (
    <Select
      value={value?.id}
      disabled={disabled}
      aria-label="具体规格"
      showSearch
      filterOption={(input, option) =>
        Boolean(
          options
            .find((item) => item.id === option.props.value)
            ?.name.toLowerCase()
            .includes(input.toLowerCase()),
        )
      }
      loading={query.isFetching}
      placeholder={`请选择${label}`}
      options={options.map((item) => {
        const unavailable = !item.enabled || !item.selectable;
        return {
          value: item.id,
          label: (
            <span className="inline-flex max-w-full items-center gap-2 align-middle">
              <Tooltip
                content={
                  <div className="flex flex-col gap-1">
                    <div>{item.name}</div>
                    <div>CPU：{item.cpu_millis} mCPU</div>
                    <div>内存：{item.memory_mib} MiB</div>
                    {item.gpu && (
                      <>
                        <div>GPU 型号：{item.gpu.model_key}</div>
                        <div>GPU 数量：{item.gpu.devices_per_instance}</div>
                      </>
                    )}
                  </div>
                }
              >
                <span className="truncate">{item.name}</span>
              </Tooltip>
              {unavailable && (
                <Tooltip content={item.unavailable_reason || "当前规格不可选"}>
                  <span
                    className="inline-flex shrink-0"
                    style={{ color: "rgb(var(--warning-6))" }}
                    role="img"
                    aria-label="规格不可选"
                  >
                    <IconExclamationCircle />
                  </span>
                </Tooltip>
              )}
            </span>
          ),
          disabled: unavailable,
        };
      })}
      onChange={(id) => onChange?.(options.find((item) => item.id === id))}
    />
  );
}
