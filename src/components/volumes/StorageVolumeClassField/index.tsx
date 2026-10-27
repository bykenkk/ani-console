import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listStorageClasses } from "@/api/storage/classes";
import { withFirst100 } from "@/api/pagination";

const listClassOptions = withFirst100(listStorageClasses);
export default function StorageVolumeClassField() {
  const classes = useQuery({
    queryKey: ["storage", "classes", "options"],
    queryFn: ({ signal }) => listClassOptions({}, signal),
    meta: { errorNotification: { id: "storage-classes", action: "云盘类型加载" } },
  });
  return (
    <Form.Item
      label="云盘类型"
      field="storageClassName"
      rules={[{ required: true, message: "请选择云盘类型" }]}
    >
      <Select
        placeholder="请选择云盘类型"
        loading={classes.isFetching}
        filterOption={false}
        options={classes.data?.items.map((item) => ({ value: item.name, label: item.name })) ?? []}
      />
    </Form.Item>
  );
}
