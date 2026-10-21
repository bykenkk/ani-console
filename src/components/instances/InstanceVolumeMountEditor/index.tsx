import { Button, Input, Select, Switch, Tooltip } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import { listMountablePvcs, type InstanceVolumeMount } from "@/api/instances";
import { withFirst100 } from "@/api/pagination";

type InstanceVolumeMountEditorProps = {
  value?: InstanceVolumeMount[];
  onChange?: (value: InstanceVolumeMount[]) => void;
};

const listPvcOptions = withFirst100(listMountablePvcs);

export default function InstanceVolumeMountEditor({
  value = [],
  onChange,
}: InstanceVolumeMountEditorProps) {
  const query = useQuery({
    queryKey: ["instance-mountable-pvcs", "options"],
    queryFn: ({ signal }) => listPvcOptions({}, signal),
    meta: { errorNotification: { id: "instance-mountable-pvcs", action: "可挂载卷加载" } },
  });
  const update = (index: number, changes: Partial<InstanceVolumeMount>) =>
    onChange?.(value.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  return (
    <div className="flex flex-col gap-3">
      {value.map((mount, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-3"
        >
          <Select
            aria-label={`存储卷 ${index + 1}`}
            value={mount.pvc_name || undefined}
            placeholder="选择已有存储卷"
            showSearch
            loading={query.isFetching}
            options={(query.data?.items ?? []).map((pvc) => ({
              value: pvc.pvc_name,
              label: `${pvc.pvc_name} · ${pvc.requested_capacity} · ${pvc.access_modes.join(" / ")}`,
              disabled: !pvc.selectable,
              extra: pvc.unavailable_reason,
            }))}
            onChange={(pvc_name) => update(index, { pvc_name })}
          />
          <Input
            aria-label={`挂载路径 ${index + 1}`}
            placeholder="挂载路径，例如 /data"
            value={mount.mount_path}
            onChange={(mount_path) => update(index, { mount_path })}
          />
          <Tooltip content="只读挂载">
            <Switch
              aria-label={`只读挂载 ${index + 1}`}
              checked={mount.read_only}
              checkedText="只读"
              uncheckedText="读写"
              onChange={(read_only) => update(index, { read_only })}
            />
          </Tooltip>
          <Button
            icon={<IconDelete />}
            aria-label={`删除挂载 ${index + 1}`}
            title="删除挂载"
            onClick={() => onChange?.(value.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <Button
        type="outline"
        icon={<IconPlus />}
        disabled={value.length >= 8}
        onClick={() => onChange?.([...value, { pvc_name: "", mount_path: "", read_only: false }])}
      >
        添加挂载
      </Button>
    </div>
  );
}
