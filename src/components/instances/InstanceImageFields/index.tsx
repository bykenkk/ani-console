import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Form, Input, Select } from "@arco-design/web-react";
import {
  listImageRegistrations,
  type ImageRegistration,
  type ImageRegistrationScope,
} from "@/api/images";
import { withId } from "@/lib/id";

export default function InstanceImageFields({
  onChange,
}: {
  onChange: (image?: ImageRegistration) => void;
}) {
  const [scope, setScope] = useState<ImageRegistrationScope>("tenant");
  const [selected, setSelected] = useState<ImageRegistration>();
  const query = useQuery({
    // FIXME(instance-image-options): 镜像列表仍为 limit/cursor 契约，尚不支持选项请求 pageSize=100；保留原请求。
    // TODO(instance-image-options): 后端分页契约对齐后改为 page=1、pageSize=100，保持一次请求且无额外翻页入口。
    queryKey: ["instance-images", scope],
    queryFn: ({ signal }) => listImageRegistrations({ scope }, signal),
    meta: { errorNotification: { id: withId("instance-images", scope), action: "实例镜像加载" } },
  });
  const items = query.data?.items ?? [];
  const options =
    selected && !items.some((item) => item.image_id === selected.image_id)
      ? [selected, ...items]
      : items;
  return (
    <Form.Item label="镜像" required>
      <Input.Group compact>
        <Select
          aria-label="镜像来源"
          style={{ width: 120 }}
          value={scope}
          options={[
            { value: "tenant", label: "用户镜像" },
            { value: "platform", label: "平台镜像" },
          ]}
          onChange={(value: ImageRegistrationScope) => {
            setScope(value);
            setSelected(undefined);
            onChange();
          }}
        />
        <Form.Item
          field="image_id"
          noStyle={{ showErrorTip: true }}
          rules={[{ required: true, message: "请选择已注册的镜像" }]}
        >
          <Select
            aria-label="镜像"
            style={{ width: "calc(100% - 120px)" }}
            showSearch
            loading={query.isFetching}
            placeholder="请选择已注册的镜像"
            options={options.map((item) => ({
              value: item.image_id,
              label: item.displayName || item.image_id,
            }))}
            onChange={(id) => {
              const image = options.find((item) => item.image_id === id);
              setSelected(image);
              onChange(image);
            }}
          />
        </Form.Item>
      </Input.Group>
    </Form.Item>
  );
}
