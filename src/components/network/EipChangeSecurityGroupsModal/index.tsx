import { Alert, Form, Modal, Spin } from "@arco-design/web-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEipSecurityGroups, setEipSecurityGroups } from "@/api/network";
import SecurityGroupSelect from "@/components/common/SecurityGroupSelect";
import { validateForm } from "@/lib/form";
import { withId } from "@/lib/id";

type EipChangeSecurityGroupsModalProps = {
  eip: { id: string; name: string };
  onCancel: () => void;
  onSubmitted?: () => void;
};
type EipChangeSecurityGroupsFormValues = { security_group_ids: string[] };

export default function EipChangeSecurityGroupsModal({
  eip,
  onCancel,
  onSubmitted,
}: EipChangeSecurityGroupsModalProps) {
  const { id, name } = eip;
  const [form] = Form.useForm<EipChangeSecurityGroupsFormValues>();
  const qc = useQueryClient();
  const current = useQuery({
    queryKey: ["security-group-selection", "eip", id],
    queryFn: async ({ signal }) => (await getEipSecurityGroups(id, signal)).binding,
    refetchOnWindowFocus: false,
    meta: {
      errorNotification: { id: withId("security-group-selection", id), action: "安全组绑定加载" },
    },
  });
  const update = useMutation({
    mutationFn: async (values: EipChangeSecurityGroupsFormValues) => {
      if (!current.data) throw new Error("请等待绑定信息加载");
      const previous = current.data;
      await setEipSecurityGroups(id, {
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
        ...(previous.applied_security_group_ids ?? []),
        ...(values.security_group_ids ?? []),
      ]);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["network-security-groups"] }),
        ...[...securityGroupIds].map((securityGroupId) =>
          qc.invalidateQueries({
            queryKey: ["network-security-group-bindings", securityGroupId],
          }),
        ),
        qc.invalidateQueries({ queryKey: ["security-group-selection", "eip", id] }),
        qc.invalidateQueries({ queryKey: ["network-eips"] }),
      ]);
      onSubmitted?.();
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title={`更换安全组 · ${name}`}
      okText="保存"
      onCancel={onCancel}
      confirmLoading={update.isPending}
      closable={!update.isPending}
      maskClosable={!update.isPending}
      escToExit={!update.isPending}
      cancelButtonProps={{ disabled: update.isPending }}
      okButtonProps={{ disabled: !current.data || current.isFetching }}
      onOk={async () =>
        update.mutateAsync(await validateForm<EipChangeSecurityGroupsFormValues>(form))
      }
    >
      <Alert
        className="mb-4"
        type="info"
        content="可选择多个安全组，保存后将替换当前绑定。清空选择可解绑全部安全组。"
      />
      <Spin loading={current.isLoading} className="w-full">
        {current.data && (
          <Form
            key={current.data.version}
            form={form}
            layout="vertical"
            initialValues={{ security_group_ids: current.data.security_group_ids ?? [] }}
            disabled={update.isPending}
          >
            <Form.Item field="security_group_ids" label="安全组">
              <SecurityGroupSelect disabled={update.isPending} />
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Modal>
  );
}
