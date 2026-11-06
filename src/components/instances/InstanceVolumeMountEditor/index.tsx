import { Button, Form, Input, Select } from "@arco-design/web-react";
import { IconDelete, IconPlus } from "@arco-design/web-react/icon";
import { useQuery } from "@tanstack/react-query";
import { listMountablePvcs, type InstanceVolumeMount } from "@/api/instances";
import { withFirst100 } from "@/api/pagination";
import { validateMountPath } from "../ContainerResourceFields/utils";

const listPvcOptions = withFirst100(listMountablePvcs);
const ROW_CLASS_NAME = "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_88px_32px] items-start gap-3";

export default function InstanceVolumeMountEditor() {
  const { form, disabled } = Form.useFormContext();
  const query = useQuery({
    queryKey: ["instance-mountable-pvcs", "options"],
    queryFn: ({ signal }) => listPvcOptions({}, signal),
    meta: { errorNotification: { id: "instance-mountable-pvcs", action: "可挂载卷加载" } },
  });
  return (
    <Form.List<InstanceVolumeMount>
      field="volume_mounts"
      noStyle={{ showErrorTip: true }}
      rules={[{ type: "array", maxLength: 8, message: "最多添加 8 个挂载" }]}
    >
      {(fields, { add, remove }) => (
        <div className="flex flex-col gap-3">
          {fields.map((item, index) => (
            <div key={item.key} className={ROW_CLASS_NAME}>
              <Form.Item
                field={`${item.field}.pvc_name`}
                style={{ marginBottom: 0 }}
                formatter={(name: string | undefined) => name || undefined}
                rules={[{ required: true, message: "请选择存储卷" }]}
              >
                <Select
                  aria-label={`存储卷 ${index + 1}`}
                  placeholder="请选择存储卷"
                  showSearch
                  loading={query.isFetching}
                  options={(query.data?.items ?? []).map((pvc) => ({
                    value: pvc.pvc_name,
                    label: `${pvc.pvc_name} · ${pvc.requested_capacity} · ${pvc.access_modes.join(" / ")}`,
                    disabled: !pvc.selectable,
                    extra: pvc.unavailable_reason,
                  }))}
                />
              </Form.Item>
              <Form.Item
                field={`${item.field}.mount_path`}
                style={{ marginBottom: 0 }}
                dependencies={["workspace_mount_path", "volume_mounts"]}
                rules={[
                  { required: true, message: "请输入挂载路径" },
                  {
                    validator: (path: string | undefined, cb) => {
                      const invalid = validateMountPath(path ?? "");
                      if (invalid) {
                        cb(invalid);
                        return;
                      }
                      const mounts: InstanceVolumeMount[] =
                        form.getFieldValue("volume_mounts") ?? [];
                      const paths = [
                        form.getFieldValue("workspace_mount_path"),
                        ...mounts.filter((_, i) => i !== index).map((mount) => mount.mount_path),
                      ].filter(Boolean);
                      cb(
                        paths.some(
                          (other) =>
                            other === path ||
                            other.startsWith(`${path}/`) ||
                            path?.startsWith(`${other}/`),
                        )
                          ? "挂载路径不能重叠，也不能与工作卷重叠"
                          : undefined,
                      );
                    },
                  },
                ]}
              >
                <Input
                  aria-label={`挂载路径 ${index + 1}`}
                  placeholder="请输入挂载路径，例如 /data"
                />
              </Form.Item>
              <Form.Item
                field={`${item.field}.read_only`}
                style={{ marginBottom: 0 }}
                formatter={(readOnly: boolean | undefined) =>
                  readOnly ? "read_only" : "read_write"
                }
                getValueFromEvent={(mode: string) => mode === "read_only"}
              >
                <Select
                  aria-label={`访问模式 ${index + 1}`}
                  options={[
                    { value: "read_write", label: "读写" },
                    { value: "read_only", label: "只读" },
                  ]}
                />
              </Form.Item>
              <Button
                icon={<IconDelete />}
                aria-label={`移除挂载 ${index + 1}`}
                title={`移除挂载 ${index + 1}`}
                disabled={disabled}
                onClick={() => remove(index)}
              />
            </div>
          ))}
          <div className="flex justify-start">
            <Button
              type="text"
              style={{ padding: 0 }}
              icon={<IconPlus />}
              aria-label="添加挂载"
              disabled={disabled || fields.length >= 8}
              onClick={() => {
                if (fields.length < 8) add({ pvc_name: "", mount_path: "", read_only: false });
              }}
            >
              添加
            </Button>
          </div>
        </div>
      )}
    </Form.List>
  );
}
