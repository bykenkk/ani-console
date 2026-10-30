import { Descriptions, Empty, Typography } from "@arco-design/web-react";
import type { VirtualMachine } from "@/api/vms";
import { DataTable, StatusBadge } from "@/components/common";
import { formatBytes, formatDateTime } from "@/lib/format";

const states = {
  AVAILABLE: "来宾信息已读取",
  NOT_RUNNING: "虚拟机当前未运行，暂无来宾信息",
  AGENT_NOT_CONNECTED: "来宾代理未连接，请检查 QEMU Guest Agent 是否已安装并运行",
  UNAVAILABLE: "暂时无法读取来宾信息，请刷新后重试",
  CHANGED: "读取期间虚拟机运行实例发生变化，请刷新后重试",
};
const filesystemStates = {
  AVAILABLE: "来宾未报告文件系统",
  UNSUPPORTED: "来宾代理不支持文件系统查询",
  UNAVAILABLE: "暂时无法读取文件系统信息",
  NOT_QUERIED: "来宾代理连接后可查看文件系统信息",
};
function bytes(value?: string) {
  return value == null ? "-" : formatBytes(Number(value));
}

export default function VmGuestInfo({ vm }: { vm: VirtualMachine }) {
  const runtime = vm.runtime;
  const elapsed =
    runtime?.startedAt && runtime.observedAt
      ? Math.floor((Date.parse(runtime.observedAt) - Date.parse(runtime.startedAt)) / 60000)
      : undefined;
  return (
    <div className="flex flex-col gap-6">
      <div className="self-start">
        <StatusBadge tone={runtime?.state === "AVAILABLE" ? "success" : "neutral"}>
          {runtime ? states[runtime.state] : "暂未读取运行信息"}
        </StatusBadge>
      </div>
      <Descriptions
        title="运行与来宾系统"
        column={2}
        labelStyle={{ minWidth: 120 }}
        data={[
          { label: "当前节点", value: runtime?.nodeName || "-" },
          { label: "本次运行开始", value: formatDateTime(runtime?.startedAt) },
          {
            label: "观测时运行时长",
            value:
              elapsed != null && Number.isFinite(elapsed) && elapsed >= 0
                ? `${Math.floor(elapsed / 60)} 小时 ${elapsed % 60} 分钟`
                : "-",
          },
          { label: "观测时间", value: formatDateTime(runtime?.observedAt) },
          {
            label: "来宾代理",
            value:
              runtime?.agentState === "CONNECTED"
                ? "已连接"
                : runtime?.agentState === "NOT_CONNECTED"
                  ? "未连接"
                  : "未知",
          },
          { label: "代理版本", value: runtime?.agentVersion || "-" },
          { label: "主机名", value: runtime?.hostname || "-" },
          { label: "当前操作系统", value: runtime?.osName || "-" },
          { label: "系统版本", value: runtime?.osVersion || "-" },
          { label: "内核", value: runtime?.kernelRelease || "-" },
          { label: "内核版本", value: runtime?.kernelVersion || "-" },
        ]}
      />
      <div className="flex flex-col gap-2">
        <Typography.Text type="secondary">
          以下为来宾报告的文件系统容量，与云盘分配容量分别展示。同一块云盘可能包含多个文件系统。
        </Typography.Text>
        <DataTable
          header={{ title: "来宾文件系统" }}
          data={runtime?.filesystems ?? []}
          rowKey={(fs) => `${fs.diskName}:${fs.mountPoint}`}
          pagination={false}
          noDataElement={
            <Empty
              description={
                runtime ? filesystemStates[runtime.filesystemsState] : "暂未读取运行信息"
              }
            />
          }
          columns={[
            { title: "来宾设备", dataIndex: "diskName", width: 160 },
            { title: "挂载点", dataIndex: "mountPoint", width: 180, ellipsis: true },
            { title: "文件系统", dataIndex: "fileSystemType", width: 130 },
            { title: "总容量", width: 130, render: (_, fs) => bytes(fs.totalBytes) },
            { title: "已用", width: 130, render: (_, fs) => bytes(fs.usedBytes) },
            {
              title: "未用",
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
    </div>
  );
}
