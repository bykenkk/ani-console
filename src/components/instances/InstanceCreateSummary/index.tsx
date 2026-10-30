import { Descriptions } from "@arco-design/web-react";
import type { InstanceEnvVar, InstancePreset, InstanceVolumeMount } from "@/api/instances";
import type { ImageRegistration } from "@/api/images";

type InstanceCreateSummaryProps = {
  values: {
    name: string;
    preset?: InstancePreset;
    image?: ImageRegistration;
    workspace_mount_path: string;
    volume_mounts: InstanceVolumeMount[];
    vpc_id: string;
    subnet_id: string;
    security_group_ids?: string[];
    env: InstanceEnvVar[];
    labels: InstanceEnvVar[];
    annotations: InstanceEnvVar[];
  };
};

export default function InstanceCreateSummary({ values }: InstanceCreateSummaryProps) {
  const { preset, image } = values;
  return (
    <Descriptions
      column={1}
      border
      data={[
        { label: "名称", value: values.name.trim() || "-" },
        {
          label: "镜像来源",
          value: image ? (image.scope === "platform" ? "平台镜像" : "用户镜像") : "-",
        },
        { label: "镜像", value: image?.displayName || image?.image_id || "-" },
        {
          label: "实例预设",
          value: preset
            ? `${preset.name} · ${Number(preset.cpu_millis) / 1000} CPU / ${preset.memory_mib} MiB`
            : "-",
        },
        { label: "VPC", value: values.vpc_id || "-" },
        { label: "子网", value: values.subnet_id || "-" },
        { label: "安全组", value: values.security_group_ids?.join(" · ") || "未绑定" },
        { label: "工作目录", value: values.workspace_mount_path },
        {
          label: "存储卷挂载",
          value: values.volume_mounts.length ? (
            <div className="flex flex-col gap-2">
              {values.volume_mounts.map((mount, index) => (
                <div key={index} className="break-all">
                  {mount.pvc_name} → {mount.mount_path} · {mount.read_only ? "只读" : "读写"}
                </div>
              ))}
            </div>
          ) : (
            "-"
          ),
        },
        ...(["env", "labels", "annotations"] as const).map((key) => ({
          label: { env: "环境变量", labels: "标签", annotations: "注解" }[key],
          value: values[key].length ? (
            <div className="flex flex-col gap-2">
              {values[key].map((row) => (
                <div key={row.name} className="whitespace-pre-wrap break-all">
                  {row.name}={row.value}
                </div>
              ))}
            </div>
          ) : (
            "-"
          ),
        })),
      ]}
    />
  );
}
