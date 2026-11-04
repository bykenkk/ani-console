import { Alert, Descriptions } from "@arco-design/web-react";
import type { VirtualMachine } from "@/api/vms";
import { DataTable, StatusBadge } from "@/components/common";
import { formatBytes, formatDateTime } from "@/lib/format";

function bytes(value?: string) {
  return value == null ? "-" : formatBytes(Number(value));
}

type VmGuestInfoProps = { vm: VirtualMachine };

export default function VmGuestInfo({ vm }: VmGuestInfoProps) {
  const runtime = vm.runtime;
  let alertType: "info" | "success" | "warning" = "info";
  let alertContent = "暂未获取系统信息";
  switch (runtime?.state) {
    case "AVAILABLE":
      alertType = "success";
      alertContent = "系统信息已获取";
      if (runtime.filesystemsState === "UNSUPPORTED") {
        alertType = "warning";
        alertContent = "系统信息已获取，当前 QEMU Guest Agent 不支持查询文件系统信息";
      } else if (runtime.filesystemsState === "UNAVAILABLE") {
        alertType = "warning";
        alertContent = "系统信息已获取，暂时无法获取文件系统信息，请刷新后重试";
      } else if (runtime.filesystemsState === "NOT_QUERIED") {
        alertType = "info";
        alertContent = "系统信息已获取，QEMU Guest Agent 连接后可查看文件系统信息";
      }
      break;
    case "NOT_RUNNING":
      alertContent = "云主机未运行，启动后可查看系统信息";
      break;
    case "AGENT_NOT_CONNECTED":
      alertType = "warning";
      alertContent = "无法获取系统信息，请确认云主机内已安装并启动 QEMU Guest Agent";
      break;
    case "UNAVAILABLE":
      alertType = "warning";
      alertContent = "暂时无法获取系统信息，请刷新后重试";
      break;
    case "CHANGED":
      alertType = "warning";
      alertContent = "采集期间云主机运行实例发生变化，请刷新后重新获取系统信息";
      break;
  }
  const elapsed =
    runtime?.startedAt && runtime.observedAt
      ? Math.floor((Date.parse(runtime.observedAt) - Date.parse(runtime.startedAt)) / 60000)
      : undefined;
  return (
    <div className="flex flex-col gap-4">
      {alertType !== "success" && <Alert type={alertType} content={alertContent} />}
      <Descriptions
        title="系统信息"
        size="medium"
        column={2}
        tableLayout="fixed"
        labelStyle={{ width: 120, verticalAlign: "top" }}
        valueStyle={{ overflowWrap: "anywhere", verticalAlign: "top" }}
        data={[
          { label: "操作系统", value: runtime?.osName || "-" },
          { label: "操作系统版本", value: runtime?.osVersion || "-" },
          { label: "主机名", value: runtime?.hostname || "-" },
          { label: "内核发行版本", value: runtime?.kernelRelease || "-" },
          { label: "内核版本", value: runtime?.kernelVersion || "-" },
        ]}
      />
      <Descriptions
        title="运行信息"
        size="medium"
        column={2}
        tableLayout="fixed"
        labelStyle={{ width: 120, verticalAlign: "top" }}
        valueStyle={{ overflowWrap: "anywhere", verticalAlign: "top" }}
        data={[
          { label: "所在节点", value: runtime?.nodeName || "-" },
          { label: "启动时间", value: formatDateTime(runtime?.startedAt) },
          {
            label: "运行时长",
            value:
              elapsed != null && Number.isFinite(elapsed) && elapsed >= 0
                ? `${Math.floor(elapsed / 60)} 小时 ${elapsed % 60} 分钟`
                : "-",
          },
          { label: "数据采集时间", value: formatDateTime(runtime?.observedAt) },
        ]}
      />
      <Descriptions
        title="QEMU Guest Agent"
        size="medium"
        column={2}
        tableLayout="fixed"
        labelStyle={{ width: 120, verticalAlign: "top" }}
        valueStyle={{ overflowWrap: "anywhere", verticalAlign: "top" }}
        data={[
          {
            label: "连接状态",
            value: (
              <StatusBadge
                tone={
                  runtime?.agentState === "CONNECTED"
                    ? "success"
                    : runtime?.agentState === "NOT_CONNECTED"
                      ? "warning"
                      : "neutral"
                }
              >
                {runtime?.agentState === "CONNECTED"
                  ? "已连接"
                  : runtime?.agentState === "NOT_CONNECTED"
                    ? "未连接"
                    : "未知"}
              </StatusBadge>
            ),
          },
          { label: "版本", value: runtime?.agentVersion || "-" },
        ]}
      />
      <DataTable
        header={{ title: "文件系统" }}
        data={runtime?.filesystems ?? []}
        rowKey={(fs) => `${fs.diskName}:${fs.mountPoint}`}
        pagination={false}
        columns={[
          { title: "挂载点", dataIndex: "mountPoint", width: 180, ellipsis: true, fixed: "left" },
          { title: "设备名称", dataIndex: "diskName", width: 160 },
          { title: "文件系统类型", dataIndex: "fileSystemType", width: 130 },
          { title: "总容量", width: 130, render: (_, fs) => bytes(fs.totalBytes) },
          { title: "已用容量", width: 130, render: (_, fs) => bytes(fs.usedBytes) },
          {
            title: "未用容量",
            width: 130,
            render: (_, fs) =>
              fs.totalBytes != null &&
              fs.usedBytes != null &&
              BigInt(fs.totalBytes) >= BigInt(fs.usedBytes)
                ? bytes(String(BigInt(fs.totalBytes) - BigInt(fs.usedBytes)))
                : "-",
          },
        ]}
      />
    </div>
  );
}
