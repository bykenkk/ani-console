import { useState } from "react";
import { Select, Tooltip } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "ahooks";
import { listInstanceMountablePvcs } from "@/api/instances";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";

type InstancePvcSelectProps = {
  instanceId: string;
  value?: string;
  onChange?: (value: string) => void;
};

const ACCESS_MODE_LABELS: Record<string, string> = {
  ReadWriteOnce: "单节点读写",
  ReadOnlyMany: "多节点只读",
  ReadWriteMany: "多节点读写",
  ReadWriteOncePod: "单 Pod 读写",
};

export default function InstancePvcSelect({ instanceId, value, onChange }: InstancePvcSelectProps) {
  const [search, setSearch] = useState("");
  const name = useDebounce(search.trim(), { wait: 300 });
  const query = useQuery({
    queryKey: ["instance-mountable-pvcs", instanceId, "options", name],
    queryFn: ({ signal }) =>
      withFirst100((params, signal) => listInstanceMountablePvcs(instanceId, params, signal))(
        { name: name || undefined },
        signal,
      ),
    meta: {
      errorNotification: {
        id: withId("instance-mountable-pvcs", instanceId),
        action: "可挂载卷加载",
      },
    },
  });
  return (
    <Select
      value={value}
      onChange={onChange}
      showSearch
      filterOption={false}
      onSearch={setSearch}
      loading={query.isFetching}
      placeholder="请选择已有 PVC"
      triggerProps={{ autoAlignPopupWidth: true, autoAlignPopupMinWidth: false }}
      options={(query.data?.items ?? []).map((pvc) => {
        const accessModes = pvc.access_modes.map((mode) => ACCESS_MODE_LABELS[mode] ?? mode);
        return {
          value: pvc.pvc_name,
          label: (
            <Tooltip
              content={
                !pvc.selectable ? (
                  pvc.unavailable_reason || "当前云盘不可选"
                ) : (
                  <div className="flex max-w-96 flex-col gap-1 wrap-anywhere">
                    <div>{pvc.pvc_name}</div>
                    <div>读写模式：{accessModes.join("、") || "-"}</div>
                    <div>容量：{pvc.requested_capacity || "-"}</div>
                  </div>
                )
              }
            >
              <span className="block w-full truncate">{pvc.pvc_name}</span>
            </Tooltip>
          ),
          disabled: !pvc.selectable,
        };
      })}
    />
  );
}
