import type { ConsoleOverviewStatistics } from "@/api/overview";
import type { HomeSummaryCard } from ".";

export const homeSummaryPlaceholders: HomeSummaryCard[] = [
  {
    id: "instances",
    label: "实例总数",
    value: null,
    icon: "yunzhuji",
    route: "/vms",
    statuses: [
      { label: "运行中", value: null, tone: "success" },
      { label: "异常", value: null, tone: "danger" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
  {
    id: "inference-services",
    label: "推理服务",
    value: null,
    icon: "tuili",
    route: "/ai-inference",
    statuses: [
      { label: "运行中", value: null, tone: "success" },
      { label: "异常", value: null, tone: "danger" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
  {
    id: "models",
    label: "模型仓库",
    value: null,
    icon: "moxing",
    route: "/ai-models",
    statuses: [
      { label: "可用", value: null, tone: "success" },
      { label: "失败", value: null, tone: "danger" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
  {
    id: "knowledge-bases",
    label: "知识库",
    value: null,
    icon: "zhishiku",
    // TODO(feature-visibility): 待知识库管理支持后恢复卡片跳转，暂保留统计展示。
    // route: "/kb",
    statuses: [
      { label: "活跃", value: null, tone: "success" },
      { label: "其他", value: null, tone: "neutral" },
    ],
  },
];

export function toHomeSummaries(overview: ConsoleOverviewStatistics): HomeSummaryCard[] {
  const instanceRunning = overview.instances.by_state.running;
  const instanceFailed = overview.instances.by_state.failed;
  const inferenceRunning = overview.inference_services.by_status.running;
  const inferenceFailed = overview.inference_services.by_status.failed;
  const modelReady = overview.models.by_status.ready;
  const modelFailed = overview.models.by_status.error;
  const knowledgeBaseActive = overview.knowledge_bases.by_status.active;

  return [
    {
      id: "instances",
      label: "实例总数",
      value: overview.instances.total,
      icon: "yunzhuji",
      route: "/vms",
      statuses: [
        { label: "运行中", value: instanceRunning, tone: "success" },
        { label: "异常", value: instanceFailed, tone: "danger" },
        {
          label: "其他",
          value: overview.instances.other,
          tone: "neutral",
        },
      ],
    },
    {
      id: "inference-services",
      label: "推理服务",
      value: overview.inference_services.total,
      icon: "tuili",
      route: "/ai-inference",
      statuses: [
        { label: "运行中", value: inferenceRunning, tone: "success" },
        { label: "异常", value: inferenceFailed, tone: "danger" },
        {
          label: "其他",
          value: overview.inference_services.other,
          tone: "neutral",
        },
      ],
    },
    {
      id: "models",
      label: "模型仓库",
      value: overview.models.total,
      icon: "moxing",
      route: "/ai-models",
      statuses: [
        { label: "可用", value: modelReady, tone: "success" },
        { label: "失败", value: modelFailed, tone: "danger" },
        {
          label: "其他",
          value: overview.models.other,
          tone: "neutral",
        },
      ],
    },
    {
      id: "knowledge-bases",
      label: "知识库",
      value: overview.knowledge_bases.total,
      icon: "zhishiku",
      // TODO(feature-visibility): 待知识库管理支持后恢复卡片跳转，暂保留统计展示。
      // route: "/kb",
      statuses: [
        { label: "活跃", value: knowledgeBaseActive, tone: "success" },
        {
          label: "其他",
          value: overview.knowledge_bases.other,
          tone: "neutral",
        },
      ],
    },
  ];
}
