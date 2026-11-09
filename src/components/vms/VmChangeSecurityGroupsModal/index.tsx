import { Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setVmSecurityGroups, type VirtualMachine } from "@/api/vms";
import SecurityGroupSelect from "@/components/common/SecurityGroupSelect";
import { validateForm } from "@/lib/form";

type VmChangeSecurityGroupsModalProps = {
  instance: Pick<VirtualMachine, "id" | "name" | "version" | "security_group_ids">;
  onCancel: () => void;
  onSubmitted?: () => void;
};
type VmChangeSecurityGroupsFormValues = { security_group_ids: string[] };

export default function VmChangeSecurityGroupsModal({
  instance,
  onCancel,
  onSubmitted,
}: VmChangeSecurityGroupsModalProps) {
  const { id, name } = instance;
  const [form] = Form.useForm<VmChangeSecurityGroupsFormValues>();
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: async (values: VmChangeSecurityGroupsFormValues) => {
      const previous = instance;
      await setVmSecurityGroups(id, {
        expected_version: previous.version,
        security_group_ids: values.security_group_ids ?? [],
      });
      return previous;
    },
    meta: {
      feedback: {
        channel: "message",
        action: "更换安全组",
        successText: "更换安全组已提交",
      },
    },
    onSuccess: async (previous, values) => {
      const securityGroupIds = new Set([
        ...(previous.security_group_ids ?? []),
        ...(values.security_group_ids ?? []),
      ]);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-security-groups"] }),
        ...[...securityGroupIds].map((securityGroupId) =>
          qc.invalidateQueries({
            queryKey: ["network-security-group-bindings", securityGroupId],
          }),
        ),
        qc.invalidateQueries({ queryKey: ["vms", "list"] }),
        qc.invalidateQueries({ queryKey: ["vms", id], exact: true }),
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
      onOk={async () =>
        update.mutateAsync(await validateForm<VmChangeSecurityGroupsFormValues>(form))
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ security_group_ids: instance.security_group_ids ?? [] }}
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
    </Modal>
  );
}
