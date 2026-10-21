import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select } from "@arco-design/web-react";
import { listInstancePresets, type ComputeType, type InstancePreset } from "@/api/instances";
import { withId } from "@/lib/id";
import { withFirst100 } from "@/api/pagination";
import { closeNotification, showNotification } from "@/lib/feedback";

type InstanceComputePresetSelectProps = {
  computeType: ComputeType;
  value?: InstancePreset;
  onChange?: (preset?: InstancePreset) => void;
  disabled?: boolean;
};

const listPresetOptions = withFirst100(listInstancePresets);

export default function InstanceComputePresetSelect({
  computeType,
  value,
  onChange,
  disabled,
}: InstanceComputePresetSelectProps) {
  const query = useQuery({
    queryKey: ["compute-presets", "CONTAINER_INSTANCE", computeType, "options"],
    queryFn: ({ signal }) => listPresetOptions({ compute_type: computeType }, signal),
    meta: {
      errorNotification: { id: withId("instance-presets", computeType), action: "实例预设加载" },
    },
  });
  const catalogStatus = query.data?.gpu_catalog_status;
  useEffect(() => {
    const id = withId("instance-preset-gpu-catalog", computeType);
    if (catalogStatus === "OK") {
      closeNotification(id);
    } else if (catalogStatus === "NO_PERMISSION" || catalogStatus === "UNAVAILABLE") {
      showNotification({
        id,
        state: "error",
        action: "加载 GPU 实例预设",
        content:
          catalogStatus === "NO_PERMISSION"
            ? "当前账号无权查看 GPU 实例预设"
            : "GPU 实例预设暂不可用，请稍后重试",
      });
    }
  }, [catalogStatus, computeType, query.dataUpdatedAt]);
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
      value={value?.id ?? ""}
      disabled={disabled}
      showSearch
      loading={query.isFetching}
      placeholder="请选择实例预设"
      options={options.map((item) => ({
        value: item.id,
        label: `${item.name} · ${Number(item.cpu_millis) / 1000} CPU / ${item.memory_mib} MiB`,
        disabled: !item.enabled || !item.selectable,
        extra: item.unavailable_reason,
      }))}
      onChange={(id) => onChange?.(options.find((item) => item.id === id))}
    />
  );
}
