import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, Tooltip } from "@arco-design/web-react";
import { IconExclamationCircle } from "@arco-design/web-react/icon";
import { listInstancePresets, type ComputeType, type InstancePreset } from "@/api/instances";
import { listInferencePresets } from "@/api/inference";
import { listModelDevComputePresets } from "@/api/modeldev";
import { listVmPresets } from "@/api/vms";
import { listSandboxPresets } from "@/api/sandboxes";
import { withId } from "@/lib/id";
import { withFirst100 } from "@/api/pagination";
import { closeNotification, showNotification } from "@/lib/feedback";

export type PresetSelectProps = {
  usage?: "CONTAINER_INSTANCE" | "INFERENCE" | "TRAINING" | "VIRTUAL_MACHINE" | "SANDBOX";
  computeType?: ComputeType;
  value?: InstancePreset;
  onChange?: (preset?: InstancePreset) => void;
  disabled?: boolean;
};

const listPresetOptions = withFirst100(listInstancePresets);
const listInferencePresetOptions = withFirst100(listInferencePresets);
const listTrainingPresetOptions = withFirst100(listModelDevComputePresets);
const listVmPresetOptions = withFirst100(listVmPresets);
const listSandboxPresetOptions = withFirst100(listSandboxPresets);
const listOptionsByUsage = {
  CONTAINER_INSTANCE: listPresetOptions,
  INFERENCE: listInferencePresetOptions,
  TRAINING: listTrainingPresetOptions,
  VIRTUAL_MACHINE: listVmPresetOptions,
  SANDBOX: listSandboxPresetOptions,
};

export default function PresetSelect({
  usage = "CONTAINER_INSTANCE",
  computeType,
  value,
  onChange,
  disabled,
}: PresetSelectProps) {
  const [search, setSearch] = useState("");
  const scope = `${usage}-${computeType ?? "all"}`;
  const query = useQuery({
    queryKey: ["compute-presets", usage, computeType, "options", search],
    queryFn: ({ signal }) =>
      listOptionsByUsage[usage](
        {
          compute_type: computeType,
          name: search || undefined,
        },
        signal,
      ),
    meta: {
      errorNotification: { id: withId("compute-presets", scope), action: "加载算力规格" },
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
        action: "加载算力规格",
        content:
          catalogStatus === "NO_PERMISSION"
            ? "当前账号无权查看算力规格"
            : "算力规格暂不可用，请稍后重试",
      });
    }
  }, [catalogStatus, scope, query.dataUpdatedAt]);
  useEffect(() => {
    const current = query.data?.items.find((item) => item.id === value?.id);
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
      aria-label="算力规格"
      showSearch
      filterOption={false}
      onSearch={setSearch}
      loading={query.isFetching}
      placeholder="请选择算力规格"
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
                <Tooltip content={item.unavailable_reason || "当前算力规格不可选"}>
                  <span
                    className="inline-flex shrink-0"
                    style={{ color: "rgb(var(--warning-6))" }}
                    role="img"
                    aria-label="算力规格不可选"
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
