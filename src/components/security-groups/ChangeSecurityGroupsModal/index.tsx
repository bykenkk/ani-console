import { Form, Modal, Spin, Typography } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInstance, setInstanceSecurityGroups } from "@/api/instances";
import { getVm, setVmSecurityGroups } from "@/api/vms";
import { getEipSecurityGroups, setEipSecurityGroups } from "@/api/network";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";
import { StatusBadge } from "@/components/common";
import SecurityGroupSelect from "../SecurityGroupSelect";

type ChangeSecurityGroupsModalProps = {
  targetType: "instance" | "vm" | "eip";
  id: string;
  name: string;
  onCancel: () => void;
  onSubmitted?: (operationId: string) => void;
};
type ChangeSecurityGroupsFormValues = { security_group_ids: string[] };
const EIP_SECURITY_GROUP_STATES: Record<string, string> = {
  unbound: "未配置",
  applying: "应用中",
  waiting_for_binding: "待绑定资源",
  configured: "已配置",
  applied: "已应用",
  released: "已解除",
  degraded: "应用异常",
  failed: "应用失败",
};
export default function ChangeSecurityGroupsModal({
  targetType,
  id,
  name,
  onCancel,
  onSubmitted,
}: ChangeSecurityGroupsModalProps) {
  const [form] = Form.useForm<ChangeSecurityGroupsFormValues>();
  const qc = useQueryClient();
  const current = useQuery({
    queryKey: ["security-group-selection", targetType, id],
    queryFn: async ({ signal }) => {
      if (targetType === "eip") return (await getEipSecurityGroups(id, signal)).binding;
      if (targetType === "vm") return getVm(id, signal);
      return getInstance(id, signal);
    },
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      targetType === "eip" &&
      query.state.data &&
      "state" in query.state.data &&
      ["applying", "waiting_for_binding", "degraded"].includes(query.state.data.state)
        ? 5000
        : false,
    meta: {
      errorNotification: { id: withId("security-group-selection", id), action: "安全组绑定加载" },
    },
  });
  const eipBinding =
    targetType === "eip" && current.data && "state" in current.data ? current.data : undefined;
  const update = useMutation({
    mutationFn: async (values: ChangeSecurityGroupsFormValues) => {
      if (!current.data) throw new Error("请等待绑定信息加载");
      const input = {
        expected_version: current.data.version,
        security_group_ids: values.security_group_ids ?? [],
      };
      if (targetType === "vm") return (await setVmSecurityGroups(id, input)).id;
      if (targetType === "instance")
        return (await setInstanceSecurityGroups(id, input)).operationId;
      return (await setEipSecurityGroups(id, input)).operation?.id;
    },
    meta: {
      feedback: { channel: "message", action: "更换安全组", successText: "更换安全组已提交" },
    },
    onSuccess: async (operationId) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-security-groups"] }),
        qc.invalidateQueries({ queryKey: ["network-security-group-bindings"] }),
        qc.invalidateQueries({ queryKey: ["security-group-selection", targetType, id] }),
        ...{
          instance: [["governance-instances"], ["governance-instance", id]],
          vm: [["vms"]],
          eip: [["network-eips"]],
        }[targetType].map((queryKey) => qc.invalidateQueries({ queryKey })),
      ]);
      if (operationId) onSubmitted?.(operationId);
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title={`更换安全组 · ${name}`}
      onCancel={onCancel}
      confirmLoading={update.isPending}
      closable={!update.isPending}
      maskClosable={!update.isPending}
      escToExit={!update.isPending}
      cancelButtonProps={{ disabled: update.isPending }}
      okButtonProps={{ disabled: !current.data || current.isFetching }}
      onOk={async () => update.mutateAsync(await validateForm(form))}
    >
      <Spin loading={current.isLoading} className="w-full">
        {current.data && (
          <Form
            key={current.data.version}
            form={form}
            layout="vertical"
            initialValues={{ security_group_ids: current.data.security_group_ids ?? [] }}
            disabled={update.isPending}
          >
            {eipBinding && (
              <div className="mb-4 flex flex-col gap-2">
                <div>
                  应用状态：
                  <StatusBadge
                    status={eipBinding.state}
                    reason={eipBinding.reason}
                    loading={eipBinding.state === "applying"}
                  >
                    {EIP_SECURITY_GROUP_STATES[eipBinding.state] ?? eipBinding.state}
                  </StatusBadge>
                </div>
                <Typography.Text type="secondary">
                  已应用安全组：
                  {eipBinding.applied_security_group_ids?.length
                    ? eipBinding.applied_security_group_ids.join("、")
                    : "无"}
                </Typography.Text>
              </div>
            )}
            <Form.Item
              field="security_group_ids"
              label="安全组"
              extra="可多选；清空选择表示解除全部安全组。"
            >
              <SecurityGroupSelect />
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Modal>
  );
}
