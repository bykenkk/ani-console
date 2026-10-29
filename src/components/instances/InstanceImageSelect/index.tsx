import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input, Select } from "@arco-design/web-react";
import {
  listImageRegistrations,
  type ImageRegistration,
  type ImageRegistrationScope,
} from "@/api/images";
import { withId } from "@/lib/id";

type InstanceImageSelectProps = {
  value?: Pick<ImageRegistration, "image_id" | "scope"> & { displayName?: string };
  onChange?: (image?: ImageRegistration) => void;
  onSelect?: (image?: ImageRegistration) => void;
  onScopeChange?: (scope: ImageRegistrationScope) => void;
  disabled?: boolean;
};

export default function InstanceImageSelect({
  value,
  onChange,
  onSelect,
  onScopeChange,
  disabled,
}: InstanceImageSelectProps) {
  const [selectedScope, setSelectedScope] = useState<ImageRegistrationScope>(
    value?.scope ?? "tenant",
  );
  const scope = value?.scope ?? selectedScope;
  const query = useQuery({
    // FIXME(instance-image-options): 镜像列表仍为 limit/cursor 契约，尚不支持选项请求 pageSize=100；保留原请求。
    // TODO(instance-image-options): 后端分页契约对齐后改为 page=1、pageSize=100，保持一次请求且无额外翻页入口。
    queryKey: ["instance-images", scope],
    queryFn: ({ signal }) => listImageRegistrations({ scope }, signal),
    meta: { errorNotification: { id: withId("instance-images", scope), action: "实例镜像加载" } },
  });
  const items = query.data?.items ?? [];
  const options =
    value && !items.some((item) => item.image_id === value.image_id) ? [value, ...items] : items;
  return (
    <Input.Group compact>
      <Select
        aria-label="镜像来源"
        style={{ width: 120 }}
        value={scope}
        disabled={disabled}
        options={[
          { value: "tenant", label: "用户镜像" },
          { value: "platform", label: "平台镜像" },
        ]}
        onChange={(scope: ImageRegistrationScope) => {
          setSelectedScope(scope);
          // 来源切换只更新字段值，选择具体镜像后再触发校验。
          onChange?.(undefined);
          onScopeChange?.(scope);
        }}
      />
      <Select
        aria-label="镜像"
        style={{ width: "calc(100% - 120px)" }}
        value={value?.image_id ?? ""}
        disabled={disabled}
        showSearch
        loading={query.isFetching}
        placeholder="请选择已注册的镜像"
        options={options.map((item) => ({
          value: item.image_id,
          label: item.displayName || item.image_id,
        }))}
        onChange={(id) => {
          const image = items.find((item) => item.image_id === id);
          if (!image && id === value?.image_id) return;
          onChange?.(image);
          onSelect?.(image);
        }}
      />
    </Input.Group>
  );
}
