// FIXME(governance-migration): 原组件/适配保留供未对齐能力复核，不能作为 governance 契约使用。
// TODO(governance-migration): 后端覆盖原字段后逐项对接，避免删除未支持的能力。
import {
  listInstances,
  type FilterableInstanceState,
  type InstanceRecord,
} from "@/api/instances/legacy";
import { getInstanceDisplayIp, getInstanceNetworkValue } from "@/lib/instances";
import { getImageDisplayName } from "@/lib/render";

type ContainerInstanceRecord = InstanceRecord;

type ContainerInstanceStatus = ContainerInstanceRecord["state"];

type ContainerInstanceStatusFilter = "all" | FilterableInstanceState;

type ContainerInstanceSearchField = "name" | "id";

type ContainerInstance = {
  record: ContainerInstanceRecord;
  id: string;
  name: string;
  kind: "container";
  vpc: string;
  subnet: string;
  ip: string;
  status: ContainerInstanceStatus;
  image: string;
  cpuMemory: string;
  replicas: string;
  rolloutStatus: string;
  node: string;
  endpoint: string;
  createdAt: string;
};

type ContainerInstanceQuery = {
  status: ContainerInstanceStatusFilter;
  searchField: ContainerInstanceSearchField;
  keyword: string;
  cursor?: string;
  pageSize: number;
};

type ContainerInstanceListResult = {
  items: ContainerInstance[];
  total: number;
  next_cursor?: string | null;
};

interface ContainerInstanceDataSource {
  list(query: ContainerInstanceQuery): Promise<ContainerInstanceListResult>;
}

type InstancePage = {
  items: ContainerInstanceRecord[];
  total: number;
  next_cursor?: string | null;
};

export type ContainerInstancePageFetcher = (
  cursor: string | undefined,
  query: ContainerInstanceQuery,
) => Promise<InstancePage>;

function displayScalar(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

function formatSpec(cpu?: string, memory?: string) {
  if (!cpu || !memory) return "-";
  const cpuText = /^\d+(?:\.\d+)?$/.test(cpu) ? `${cpu}C` : cpu.replace(/c$/i, "C");
  const memoryText = /^\d+(?:\.\d+)?$/.test(memory)
    ? `${memory}G`
    : memory.replace(/gi$/i, "G").replace(/g$/i, "G");
  return `${cpuText}${memoryText}`;
}

function mapContainerInstance(record: ContainerInstanceRecord): ContainerInstance {
  const cpu = displayScalar(record.compute?.cpu);
  const memory = displayScalar(record.compute?.memory);
  const image = getImageDisplayName(record.image);

  return {
    record,
    id: record.id,
    name: record.name,
    kind: "container",
    vpc: getInstanceNetworkValue(record, "vpc_id"),
    subnet: getInstanceNetworkValue(record, "subnet_id"),
    ip: getInstanceDisplayIp(record),
    status: record.state,
    image,
    cpuMemory: formatSpec(cpu, memory),
    replicas: record.container
      ? `${record.container.ready_replicas}/${record.container.replicas}`
      : "-",
    rolloutStatus: record.container?.rollout_status ?? "-",
    node: record.compute?.node_name ?? record.node_name ?? "-",
    endpoint: record.endpoint ?? "-",
    createdAt: record.created_at,
  };
}

async function fetchContainerInstancePage(
  cursor: string | undefined,
  filters: ContainerInstanceQuery,
): Promise<InstancePage> {
  const keyword = filters.keyword.trim();
  const query = {
    kind: "container",
    limit: filters.pageSize,
    ...(cursor ? { cursor } : {}),
    state: filters.status === "all" ? undefined : filters.status,
    search_field: keyword ? filters.searchField : undefined,
    keyword: keyword || undefined,
  };
  return listInstances(query);
}

export function createContainerInstanceDataSource(
  queryFn: ContainerInstancePageFetcher = fetchContainerInstancePage,
): ContainerInstanceDataSource {
  return {
    async list(query: ContainerInstanceQuery): Promise<ContainerInstanceListResult> {
      const result = await queryFn(query.cursor, query);
      return {
        items: result.items.map(mapContainerInstance),
        total: result.total,
        next_cursor: result.next_cursor,
      };
    },
  };
}

export const containerInstanceDataSource = createContainerInstanceDataSource();
