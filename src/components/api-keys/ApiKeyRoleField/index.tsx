import { listTenantRoles } from "@/api/members";
import { Form, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { withFirst100 } from "@/api/pagination";

const listRoleOptions = withFirst100(listTenantRoles);

export function ApiKeyRoleField() {
  const roles = useQuery({
    queryKey: ["tenant-roles", "options"],
    queryFn: ({ signal }) => listRoleOptions({}, signal),
    meta: {
      errorNotification: {
        id: "tenant-roles",
        action: "角色列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const options = (roles.data?.items ?? [])
    .filter((role) => role.id && role.type === "TENANT" && role.status === "ON" && role.code)
    .map((role) => ({ value: role.id!, label: role.name || role.code! }));

  return (
    <Form.Item label="角色" field="role_id" rules={[{ required: true, message: "请选择角色" }]}>
      <Select
        placeholder="请选择角色"
        options={options}
        loading={roles.isFetching}
        disabled={roles.isFetching || options.length === 0}
        showSearch
        allowClear
        notFoundContent="暂无可用角色"
      />
    </Form.Item>
  );
}
