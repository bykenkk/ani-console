import { Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listNetworkEips } from "@/api/network";

type PublicIpSelectProps = {
  value?: string;
  onChange?: (value: string | undefined) => void;
  disabled?: boolean;
};

type PublicIpOption = {
  value: string;
  label: string;
};

export default function PublicIpSelect({ value, onChange, disabled }: PublicIpSelectProps) {
  const [name, setName] = useState("");
  const [selectedOption, setSelectedOption] = useState<PublicIpOption>();
  const eips = useQuery({
    queryKey: ["network-eips", "options", { name, state: "RESOURCE_STATE_AVAILABLE" }],
    // TODO(pagination-migration): 列表仍为 limit/cursor，每次只查询默认首批结果；后端支持 page/pageSize 后改用 withFirst100。
    // TODO: 后端提供未绑定筛选条件后接入；当前保留已占用或观测过期的选项并禁用，不在前端筛选结果。
    queryFn: ({ signal }) =>
      listNetworkEips({ name: name || undefined, state: "RESOURCE_STATE_AVAILABLE" }, signal),
    meta: {
      errorNotification: {
        id: "eips",
        action: "公网 IP 列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const options = (eips.data?.items ?? []).map((item) => ({
    value: item.id,
    disabled:
      item.state !== "available" ||
      item.binding_state !== "unbound" ||
      !item.address ||
      !item.observed_at ||
      item.observation_stale === true,
    label:
      item.address && item.name
        ? `${item.address} · ${item.name}`
        : item.address || item.name || item.id,
  }));

  return (
    <Select
      aria-label="公网 IP"
      value={value}
      disabled={disabled}
      loading={eips.isFetching}
      placeholder="请选择公网 IP，可按名称搜索"
      showSearch
      filterOption={false}
      allowClear
      options={options}
      onSearch={(text) => setName(text.trim())}
      renderFormat={(option, selectedValue) =>
        option?.children ??
        (selectedOption?.value === selectedValue ? selectedOption.label : String(selectedValue))
      }
      onChange={(id: string | undefined) => {
        setSelectedOption(options.find((option) => option.value === id));
        onChange?.(id);
      }}
    />
  );
}
