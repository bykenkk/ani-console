import { Form, Modal, Spin } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInstance, setInstanceSecurityGroups } from "@/api/instances";
import { getVm, setVmSecurityGroups } from "@/api/vms";
import { getEipSecurityGroups, setEipSecurityGroups } from "@/api/network";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";
import SecurityGroupSelect from "../SecurityGroupSelect";

type ChangeSecurityGroupsModalProps = {
  targetType: "instance" | "vm" | "eip";
  id: string;
  name: string;
  onCancel: () => void;
  onSubmitted?: () => void;
};
type ChangeSecurityGroupsFormValues = { security_group_ids: string[] };
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
    meta: {
      errorNotification: { id: withId("security-group-selection", id), action: "安全组绑定加载" },
    },
  });
  const update = useMutation({
    mutationFn: async (values: ChangeSecurityGroupsFormValues) => {
      if (!current.data) throw new Error("请等待绑定信息加载");
      const input = {
        expected_version: current.data.version,
        security_group_ids: values.security_group_ids ?? [],
      };
      await {
        instance: setInstanceSecurityGroups,
        vm: setVmSecurityGroups,
        eip: setEipSecurityGroups,
      }[targetType](id, input);
    },
    meta: {
      feedback: { channel: "message", action: "更换安全组", successText: "更换安全组已提交" },
    },
    onSuccess: async () => {
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
      onSubmitted?.();
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title={`更换安全组 · ${name}`}
      onCancel={onCancel}
      confirmLoading={update.isPending}
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
