import { Descriptions, Typography } from "@arco-design/web-react";
import type { VmMedia } from "@/api/vms";
import type { NetworkSecurityGroup } from "@/api/network";
import type { VmCreateFormValues } from "..";

type VmCreateSummaryProps = {
  values: VmCreateFormValues;
  media?: VmMedia;
  canInitialize: boolean;
  vpcName?: string;
  subnetName?: string;
  securityGroups: Pick<NetworkSecurityGroup, "id" | "name">[];
};

export default function VmCreateSummary({
  values,
  media,
  canInitialize,
  vpcName,
  subnetName,
  securityGroups,
}: VmCreateSummaryProps) {
  const initialized = canInitialize && values.login_method !== "NONE";
  const usePassword =
    initialized && (values.login_method === "PASSWORD" || values.additional_credential);
  const usePublicKey =
    initialized && (values.login_method === "SSH_PUBLIC_KEY" || values.additional_credential);
  const sections = [
    {
      title: "基础配置",
      data: [
        { label: "实例名称", value: values.name.trim() || "-" },
        {
          label: "系统来源",
          value: values.source_kind === "DISK_IMAGE" ? "从镜像创建" : "通过 ISO 安装",
        },
        {
          label: values.source_kind === "DISK_IMAGE" ? "系统镜像" : "安装镜像（ISO）",
          value: media?.name || "-",
        },
        { label: "实例规格", value: values.preset?.name || "-" },
        { label: "系统盘", value: `${values.system_disk_size_gb} GB` },
        {
          label: "数据盘",
          value: values.data_disks.length ? (
            <div className="flex flex-col gap-1">
              {values.data_disks.map((disk) => (
                <div key={disk.client_disk_key}>
                  {disk.name.trim()} · {disk.size_gb} GB
                </div>
              ))}
            </div>
          ) : (
            "未添加数据盘"
          ),
        },
      ],
    },
    {
      title: "网络与安全",
      data: [
        { label: "专有网络（VPC）", value: vpcName || "-" },
        { label: "子网", value: subnetName || "-" },
        {
          label: "安全组",
          value: values.security_group_ids.length
            ? values.security_group_ids
                .map((id) => securityGroups.find((group) => group.id === id)?.name || "-")
                .join("、")
            : "未选择安全组",
        },
        {
          label: "DNS 设置",
          value:
            values.dns_mode === "CUSTOM"
              ? values.nameservers.map((address) => address.trim()).join("、")
              : "平台默认",
        },
      ],
    },
    {
      title: "系统配置",
      data: [
        {
          label: "登录方式",
          value: !canInitialize
            ? "当前系统来源不支持创建时初始化"
            : !initialized
              ? "不设置"
              : values.additional_credential
                ? "密码 + SSH 公钥"
                : values.login_method === "PASSWORD"
                  ? "密码"
                  : "SSH 公钥",
        },
        ...(initialized
          ? [
              { label: "登录用户名", value: values.username.trim() },
              ...(usePassword ? [{ label: "登录密码", value: "已设置" }] : []),
              ...(usePublicKey ? [{ label: "SSH 公钥", value: "已配置" }] : []),
            ]
          : []),
        { label: "创建后自动开机", value: values.start_after_create ? "开机" : "不开机" },
      ],
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
