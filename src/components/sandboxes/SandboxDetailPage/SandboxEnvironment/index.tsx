import { type SandboxInstanceStatus } from "@/api/instances/legacy";
import { DataTable } from "@/components/common";
import { Descriptions, Space, Tag, Typography } from "@arco-design/web-react";
import { sandboxEgressLabel } from "../utils";

type SandboxEnvironmentProps = { sandbox: SandboxStatus };

type SandboxStatus = NonNullable<SandboxInstanceStatus>;
type SandboxEnv = NonNullable<SandboxStatus["env"]>[number];

export default function SandboxEnvironment({ sandbox }: SandboxEnvironmentProps) {
  const env = sandbox.env ?? [];
  const allowlist = sandbox.egress_allowlist ?? [];

  return (
    <Space direction="vertical" size={24} className="w-full">
      <section>
        <DataTable<SandboxEnv>
          header={{ title: "环境变量" }}
          data={env}
          rowKey="name"
          pagination={false}
          columns={[
            { title: "名称", width: 200, dataIndex: "name" },
            {
              title: "来源",
              width: 160,
              render: (_, item) =>
                item.secret_ref ? (
                  <Tag color="purple">密钥引用</Tag>
                ) : (
                  <Tag color="gray">运行时注入</Tag>
                ),
            },
            {
              title: "密钥引用",
              width: 280,
              dataIndex: "secret_ref",
            },
          ]}
        />
      </section>
      <section>
        <Typography.Title heading={6} className="mt-0! mb-3!">
          出口控制
        </Typography.Title>
        <Descriptions
          column={1}
          labelStyle={{ width: "120px" }}
          data={[
            {
              label: "策略",
              value: sandboxEgressLabel(sandbox.network_egress_policy),
            },
            {
              label: "允许的 Host",
              value:
                sandbox.network_egress_policy === "allowlist" ? (
                  allowlist.length ? (
                    <div className="flex flex-wrap gap-2">
                      {allowlist.map((host) => (
                        <Tag key={host}>{host}</Tag>
                      ))}
                    </div>
                  ) : (
                    "白名单为空，所有出站连接将被拒绝"
                  )
                ) : (
                  "-"
                ),
            },
          ]}
        />
      </section>
    </Space>
  );
}
