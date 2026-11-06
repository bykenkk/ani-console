import { Descriptions, Typography } from "@arco-design/web-react";
import type { NetworkSecurityGroup } from "@/api/network";
import type { ImageRegistration } from "@/api/images";
import type { InstanceEnvVar, InstancePreset, InstanceVolumeMount } from "@/api/instances";

type ContainerSummaryProps = {
  values: {
    name: string;
    image?: ImageRegistration;
    preset?: InstancePreset;
    network_enabled: boolean;
    security_group_ids: string[];
    workspace_mount_path: string;
    volume_mounts: InstanceVolumeMount[];
    env: InstanceEnvVar[];
    labels: InstanceEnvVar[];
    annotations: InstanceEnvVar[];
  };
  vpcName?: string;
  subnetName?: string;
  securityGroups: Pick<NetworkSecurityGroup, "id" | "name">[];
};

export default function ContainerSummary({
  values,
  vpcName,
  subnetName,
  securityGroups,
}: ContainerSummaryProps) {
  const sections = [
    {
      title: "基础配置",
      data: [
        { label: "实例名称", value: values.name.trim() || "-" },
        { label: "镜像来源", value: values.image?.scope === "platform" ? "平台镜像" : "用户镜像" },
        { label: "镜像", value: values.image?.displayName || values.image?.image_id || "-" },
        { label: "实例规格", value: values.preset?.name || values.preset?.code || "-" },
      ],
    },
    {
      title: "网络与安全",
      data: values.network_enabled
        ? [
            { label: "专有网络（VPC）", value: vpcName || "-" },
            { label: "子网", value: subnetName || "-" },
            {
              label: "安全组",
              value: values.security_group_ids.length
                ? values.security_group_ids
                    .map((id) => securityGroups.find((group) => group.id === id)?.name || "-")
                    .join("、")
                : "未绑定",
            },
          ]
        : [{ label: "专有网络（VPC）", value: "未配置" }],
    },
    {
      title: "存储配置",
      data: [
        { label: "工作卷挂载路径", value: values.workspace_mount_path },
        {
          label: "存储卷挂载",
          value: values.volume_mounts.length ? (
            <div className="flex flex-col gap-2">
              {values.volume_mounts.map((mount, index) => (
                <div key={index}>
                  {mount.pvc_name} → {mount.mount_path} · {mount.read_only ? "只读" : "读写"}
                </div>
              ))}
            </div>
          ) : (
            "未配置"
          ),
        },
      ],
    },
    {
      title: "运行配置",
      data: (["env", "labels", "annotations"] as const).map((key) => ({
        label: { env: "环境变量", labels: "标签", annotations: "注解" }[key],
        value: values[key].length ? (
          <div className="flex flex-col gap-1">
            {values[key].map((row) => (
              <div key={row.name} className="whitespace-pre-wrap">
                {row.name}={row.value}
              </div>
            ))}
          </div>
        ) : (
          "未配置"
        ),
      })),
    },
  ];
  return (
    <div className="flex flex-col gap-4 break-all">
      {sections.map((section) => (
        <section key={section.title}>
          <Typography.Title heading={6}>{section.title}</Typography.Title>
          <Descriptions column={1} data={section.data} labelStyle={{ width: 140 }} />
        </section>
      ))}
    </div>
  );
}
