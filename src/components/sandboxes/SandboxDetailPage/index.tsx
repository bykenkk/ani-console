import { Button, Empty } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { getSandbox } from "@/api/sandboxes";
import { withId } from "@/lib/id";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import {
  AliIcon,
  DetailPageFrame,
  DetailPagePlaceholder,
  ResourceId,
  StatusBadge,
} from "@/components/common";
import SandboxActions from "@/components/sandboxes/SandboxActions";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import SandboxRuntime from "./SandboxRuntime";
import SandboxWorkspace from "./SandboxWorkspace";

type SandboxDetailPageProps = {
  instanceId: string;
  tab?: string;
  onTabChange: (tab: string) => void;
};
// TODO(sandbox-legacy): 独立沙箱尚无下列正式契约；保留入口和原组件作为迁移参考，不调用旧实例接口。
const UNAVAILABLE_TABS = [
  { key: "access", label: "访问配置" },
  { key: "env", label: "环境变量" },
  { key: "files", label: "文件" },
  { key: "code", label: "运行代码" },
  { key: "checkpoints", label: "检查点" },
  { key: "metrics", label: "资源监控" },
  { key: "logs", label: "日志" },
  { key: "events", label: "事件" },
];

export default function SandboxDetailPage({
  instanceId,
  tab,
  onTabChange,
}: SandboxDetailPageProps) {
  const goBack = useBackOrFallback("sandbox-instance");
  const detail = useQuery({
    queryKey: ["sandboxes", instanceId],
    queryFn: ({ signal }) => getSandbox(instanceId, signal),
    meta: { errorNotification: { id: withId("sandbox", instanceId), action: "沙箱加载" } },
  });
  if (!detail.data) return <DetailPagePlaceholder loading={detail.isLoading} />;
  const sandbox = detail.data;
  const snapshot = sandbox.snapshot;
  const refresh = (
    <Button
      loading={detail.isFetching}
      onClick={() => {
        detail.refetch();
      }}
    >
      刷新
    </Button>
  );
  return (
    <DetailPageFrame
      breadcrumbs={[
        ...navigationBreadcrumbsForPath("/sandboxes"),
        { label: snapshot?.name || sandbox.id },
      ]}
      title={snapshot?.name || sandbox.id}
      status={
        <StatusBadge status={sandbox.observed_state} reason={sandbox.reason} loading={false} />
      }
      icon={<AliIcon name="Sandbox" size={28} />}
      headerItems={[
        {
          label: "CPU / 内存",
          value: [
            snapshot?.cpu_millis ? `${Number(snapshot.cpu_millis) / 1000}C` : "-",
            snapshot?.memory_mib ? `${Number(snapshot.memory_mib) / 1024} GiB` : "-",
          ].join(" / "),
        },
      ]}
      actions={<SandboxActions sandbox={sandbox} onDeleted={goBack} />}
      cards={[
        {
          key: "basic",
          title: "基本信息",
          fields: [
            { label: "ID", value: <ResourceId value={sandbox.id} /> },
            { label: "版本", value: sandbox.version },
            { label: "期望状态", value: sandbox.desired_state },
            { label: "计算预设", value: snapshot?.preset_name || snapshot?.preset_code || "-" },
            {
              label: "预设 ID",
              value: snapshot?.preset_id ? <ResourceId value={snapshot.preset_id} /> : "-",
            },
            { label: "镜像引用", value: snapshot?.image_reference || "-" },
            { label: "镜像摘要", value: snapshot?.image_digest || "-" },
            { label: "计算类型", value: snapshot?.compute_type || "-" },
          ],
        },
        {
          key: "operations",
          title: "操作标识",
          fields: [
            {
              label: "创建操作 ID",
              value: sandbox.create_operation_id ? (
                <ResourceId value={sandbox.create_operation_id} />
              ) : (
                "-"
              ),
            },
            {
              label: "最近操作 ID",
              value: sandbox.last_operation_id ? (
                <ResourceId value={sandbox.last_operation_id} />
              ) : (
                "-"
              ),
            },
          ],
        },
      ]}
      tabs={[
        {
          key: "runtime",
          label: "运行资源",
          content: <SandboxRuntime sandbox={sandbox} />,
          extra: refresh,
        },
        {
          key: "workspace",
          label: "工作区",
          content: <SandboxWorkspace sandbox={sandbox} />,
          extra: refresh,
        },
        ...UNAVAILABLE_TABS.map((item) => ({
          ...item,
          content: <Empty description={`独立沙箱接口暂未提供${item.label}能力`} />,
        })),
        // TODO(sandbox-task): 创建、删除任务跟踪按统一方案后续接入。
        {
          key: "operations",
          label: "操作记录",
          content: <Empty description="操作跟踪待统一接入，当前可在左侧查看操作 ID" />,
        },
      ]}
      activeTabKey={tab}
      onTabChange={onTabChange}
      onBack={goBack}
    />
  );
}
