import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Form, Select } from "@arco-design/web-react";
import { listInstancePresets, type ComputeType, type InstancePreset } from "@/api/instances";
import { withId } from "@/lib/id";
import { withFirst100 } from "@/api/pagination";

const listPresetOptions = withFirst100(listInstancePresets);

export default function InstancePresetField({
  computeType,
  onChange,
}: {
  computeType: ComputeType;
  onChange: (preset?: InstancePreset) => void;
}) {
  const [selected, setSelected] = useState<InstancePreset>();
  const query = useQuery({
    queryKey: ["instance-presets", computeType, "options"],
    queryFn: ({ signal }) => listPresetOptions({ compute_type: computeType }, signal),
    meta: {
      errorNotification: { id: withId("instance-presets", computeType), action: "实例预设加载" },
    },
  });
  const items = query.data?.items ?? [];
  const options =
    selected && !items.some((item) => item.id === selected.id) ? [selected, ...items] : items;
  return (
    <Form.Item
      field="preset_id"
      label="实例预设"
      rules={[
        { required: true, message: "请选择实例预设" },
        {
          validator: (id, callback) => {
            const preset = items.find((item) => item.id === id) ?? selected;
            callback(
              preset &&
                preset.id === id &&
                preset.compute_type === computeType &&
                preset.enabled &&
                preset.selectable
                ? undefined
                : "预设不可用，请重新选择",
            );
          },
        },
      ]}
    >
      <Select
        showSearch
        loading={query.isFetching}
        placeholder="请选择实例预设"
        options={options.map((item) => ({
          value: item.id,
          label: `${item.name} · ${Number(item.cpu_millis) / 1000} CPU / ${item.memory_mib} MiB`,
          disabled: !item.enabled || !item.selectable,
          extra: item.unavailable_reason,
        }))}
        onChange={(id) => {
          const item = options.find((option) => option.id === id);
          setSelected(item);
          onChange(item);
        }}
      />
    </Form.Item>
  );
}
