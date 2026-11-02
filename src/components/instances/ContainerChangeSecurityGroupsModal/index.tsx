import { Form, Modal, Spin } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInstance, setInstanceSecurityGroups } from "@/api/instances";
import SecurityGroupSelect from "@/components/security-groups/SecurityGroupSelect";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";

type ContainerChangeSecurityGroupsModalProps = {
  instance: { id: string; name: string };
  onCancel: () => void;
  onSubmitted?: () => void;
};
type ContainerChangeSecurityGroupsFormValues = { security_group_ids: string[] };

export default function ContainerChangeSecurityGroupsModal({
  instance,
  onCancel,
  onSubmitted,
}: ContainerChangeSecurityGroupsModalProps) {
  const { id, name } = instance;
  const [form] = Form.useForm<ContainerChangeSecurityGroupsFormValues>();
  const qc = useQueryClient();
  const current = useQuery({
    queryKey: ["security-group-selection", "instance", id],
    queryFn: ({ signal }) => getInstance(id, signal),
    refetchOnWindowFocus: false,
    meta: {
      errorNotification: { id: withId("security-group-selection", id), action: "安全组绑定加载" },
    },
  });
  const update = useMutation({
    mutationFn: async (values: ContainerChangeSecurityGroupsFormValues) => {
      if (!current.data) throw new Error("请等待绑定信息加载");
      const previous = current.data;
      await setInstanceSecurityGroups(id, {
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
        qc.invalidateQueries({ queryKey: ["security-group-selection", "instance", id] }),
        qc.invalidateQueries({ queryKey: ["instances", previous.compute_type] }),
        qc.invalidateQueries({ queryKey: ["instance", id] }),
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
      onOk={async () =>
        update.mutateAsync(await validateForm<ContainerChangeSecurityGroupsFormValues>(form))
      }
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
