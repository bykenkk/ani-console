// FIXME(governance-migration): 环境来源已接新 runtime，环境变量值、密钥引用及解绑继续保留原组件、入口和调用。
// TODO(governance-migration): 等配置读写契约补齐后再迁移，不以 environmentSources 伪造旧环境变量值。
import {
  type InstanceEnvVar,
  type InstanceRecord,
  applyInstanceLifecycle,
} from "@/api/instances/legacy";
import type { InstanceRuntime } from "@/api/instances";
import { DataTable, type RowAction } from "@/components/common";
import { Space, Tooltip, Modal } from "@arco-design/web-react";
import { type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";

type InstanceConfigurationProps = {
  instance?: Instance;
  runtime?: InstanceRuntime;
  loading?: boolean;
  onChanged: () => void;
  secretAction?: ReactNode;
};

type Instance = InstanceRecord;

type SecretRow = {
  reference: string;
  id: string;
  purpose: string;
};

function secretReferences(instance?: Instance) {
  if (!instance) return [];
  const refs = [instance.ssh?.key_ref, ...(instance.resource_refs ?? [])].filter(
    (ref): ref is string => Boolean(ref),
  );
  return Array.from(new Set(refs.filter((ref) => /secret|key|credential/i.test(ref))));
}

function secretId(reference: string) {
  return reference.replace(/^(secret|key|credential)[/:]/i, "");
}

function secretPurpose(reference: string) {
  return /pull|image|img/i.test(reference) ? "镜像拉取" : "实例密钥";
}

export default function InstanceConfiguration({
  instance,
  runtime,
  loading = false,
  onChanged,
  secretAction,
}: InstanceConfigurationProps) {
  const environmentVariables = instance?.container?.env ?? [];
  const secretRefs = secretReferences(instance);
  const secretRows: SecretRow[] = secretRefs.map((reference) => ({
    reference,
    id: secretId(reference),
    purpose: secretPurpose(reference),
  }));

  const unbindSecret = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "secret-unbind",
        action: "密钥解绑",
        successText: "密钥解绑已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async (reference: string) => {
      if (!instance) throw new Error("实例密钥信息尚未加载");
      const submitData = {
        action: "unbind_secret" as const,
        secret_id: reference.replace(/^(secret|key|credential)[/:]/i, ""),
      };
      await applyInstanceLifecycle(instance.id, submitData);
    },
    onSuccess: () => {
      onChanged();
    },
  });
  const actions: RowAction<SecretRow>[] = [
    {
      key: "unbind",
      label: "解绑",
      intent: "danger",
      loading: (secret) => unbindSecret.isPending && unbindSecret.variables === secret.reference,
      onClick: (secret) => {
        Modal.confirm({
          title: "解绑密钥",
          content: `确定解绑「${secret.id}」？`,
          okButtonProps: { status: "danger" },
          onOk: () => unbindSecret.mutateAsync(secret.reference),
        });
      },
    },
  ];

  return (
    <Space direction="vertical" size={24} className="w-full">
      {runtime && (
        <section>
          <DataTable
            header={{ title: "环境变量来源" }}
            data={runtime.pod?.environmentSources ?? []}
            rowKey="name"
            pagination={false}
            columns={[
              { title: "名称", dataIndex: "name", width: 240, ellipsis: true },
              { title: "来源类型", dataIndex: "sourceType", width: 200, ellipsis: true },
            ]}
          />
        </section>
      )}
      <section>
        <DataTable<InstanceEnvVar>
          header={{ title: "环境变量" }}
          data={environmentVariables}
          loading={loading}
          rowKey="name"
          pagination={false}
          columns={[
            { title: "名称", dataIndex: "name", ellipsis: true },
            // {
            //   title: "类型",
            //   width: 120,
            //   render: (_, environmentVariable) =>
            //     environmentVariable.secret_ref ? (
            //       <Tag color="purple">密钥引用</Tag>
            //     ) : (
            //       <Tag color="gray">普通值</Tag>
            //     ),
            // },
            {
              title: "值",
              render: (_, environmentVariable) =>
                environmentVariable.secret_ref ? (
                  <Tooltip content="该变量引用密钥，不显示明文">
                    <span className="font-mono">******</span>
                  </Tooltip>
                ) : environmentVariable.value === "" ? (
                  <span className="font-mono">&quot;&quot;</span>
                ) : (
                  <Tooltip content={environmentVariable.value ?? "-"}>
                    <span className="block min-w-0 truncate font-mono">
                      {environmentVariable.value ?? "-"}
                    </span>
                  </Tooltip>
                ),
            },
            // {
            //   title: "密钥引用",
            //   dataIndex: "secret_ref",
            //   placeholder: "-",
            //   ellipsis: true,
            // },
          ]}
        />
      </section>

      <section>
        <DataTable<SecretRow>
          header={{ title: "绑定密钥", extra: secretAction }}
          data={secretRows}
          loading={loading}
          rowKey="reference"
          pagination={false}
          rowActions={actions}
          columns={[
            { title: "密钥", dataIndex: "id", ellipsis: true },
            { title: "用途", dataIndex: "purpose" },
          ]}
        />
      </section>
    </Space>
  );
}
