import type { ReactNode } from "react";
import {
  IconApps,
  // TODO(feature-visibility): 待 GPU 算力管理支持后恢复分组图标。
  // IconCloud,
  IconCodeSandbox,
  IconDashboard,
  IconFile,
  IconLock,
  // TODO(feature-visibility): 待知识库管理支持后恢复分组图标。
  // IconMessage,
} from "@arco-design/web-react/icon";
import { AliIcon } from "@/components/common";

export interface MenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  hidden?: boolean;
  children?: MenuItem[];
}

export interface ProductGroupSection {
  label: string;
  groupKeys: readonly string[];
}

export interface NavigationBreadcrumbItem {
  label: string;
  to?: string;
}

export const menuItems: readonly MenuItem[] = [
  { key: "/", label: "概览", icon: <IconDashboard /> },
  {
    key: "products",
    label: "产品与服务",
    icon: <IconApps />,
    children: [
      {
        key: "work-instances",
        label: "工作实例",
        icon: <AliIcon name="shili" />,
        children: [
          { key: "/vms", label: "云主机", icon: <AliIcon name="yunzhuji" /> },
          {
            key: "/containers",
            label: "容器",
            icon: <AliIcon name="rongqishili" />,
          },
          { key: "/gpu-containers", label: "GPU 容器", icon: <AliIcon name="GPU" /> },
          {
            key: "/sandboxes",
            label: "沙箱",
            icon: <IconCodeSandbox />,
          },
        ],
      },
      {
        key: "storage-management",
        label: "存储管理",
        icon: <AliIcon name="storage" />,
        children: [
          { key: "/volumes", label: "块存储", icon: <AliIcon name="kuaicunchu" /> },
          {
            key: "/objects",
            label: "对象存储",
            icon: <AliIcon name="duixiangcunchu1" />,
          },
          // TODO(feature-visibility): 待文件存储支持后恢复此菜单入口。
          // {
          //   key: "/filesystems",
          //   label: "文件存储",
          //   icon: <AliIcon name="wenjiancunchu" />,
          // },
          // TODO(feature-visibility): 待向量存储支持后恢复此菜单入口。
          // {
          //   key: "/vector-stores",
          //   label: "向量存储",
          //   icon: <AliIcon name="xiangliangcunchu" />,
          // },
        ],
      },
      {
        key: "network-management",
        label: "网络管理",
        icon: <AliIcon name="wangluo" />,
        children: [
          { key: "/vpcs", label: "VPC 网络", icon: <AliIcon name="VPCwangluo" /> },
          { key: "/subnets", label: "VPC 子网", icon: <AliIcon name="ziwang" /> },
          { key: "/eips", label: "公网 IP", icon: <AliIcon name="wangluo" /> },
          {
            key: "/security-groups",
            label: "安全组",
            icon: <AliIcon name="anquanzu" />,
          },
          {
            key: "/load-balancers",
            label: "负载均衡",
            icon: <AliIcon name="fuzaijunhengqi" />,
          },
        ],
      },
      // TODO(feature-visibility): 待 GPU 算力管理支持后恢复入口及分组，暂不展示空分组。
      // {
      //   key: "compute-management",
      //   label: "算力管理",
      //   icon: <IconCloud />,
      //   children: [
      //     {
      //       key: "/overview-compute",
      //       label: "资源概览",
      //       icon: <IconDashboard />,
      //       hidden: true,
      //     },
      //     {
      //       key: "/gpu-inventory",
      //       label: "GPU 算力管理",
      //       icon: <AliIcon name="GPU" />,
      //     },
      //   ],
      // },
      {
        key: "cluster-management",
        label: "集群管理",
        icon: <AliIcon name="jiqun" />,
        hidden: true,
        children: [{ key: "/k8s-clusters", label: "K8s 集群", icon: <AliIcon name="jiqun" /> }],
      },
      {
        key: "ai-services",
        label: "AI 服务",
        icon: <AliIcon name="tuili" />,
        children: [
          { key: "/ai-models", label: "模型仓库", icon: <AliIcon name="moxing" /> },
          { key: "/ai-inference", label: "推理服务", icon: <AliIcon name="tuili" /> },
          {
            key: "/ai-inference-policies",
            label: "限流与访问策略",
            icon: <AliIcon name="anquanzu" />,
          },
          { key: "/ai-api-keys", label: "模型 API Key", icon: <AliIcon name="Ukeyguanli" /> },
          { key: "/ai-finetuning", label: "模型微调", icon: <AliIcon name="moxing" /> },
          { key: "/ai-training", label: "模型训练", icon: <AliIcon name="moxing" /> },
        ],
      },
      // TODO(feature-visibility): 待知识库管理支持后恢复此分组及菜单入口。
      // {
      //   key: "knowledge-services",
      //   label: "知识库管理",
      //   icon: <IconMessage />,
      //   children: [{ key: "/kb", label: "知识库管理", icon: <AliIcon name="zhishiku" /> }],
      // },
      {
        key: "registry-management",
        label: "镜像仓库",
        icon: <IconFile />,
        children: [{ key: "/registry", label: "镜像仓库", icon: <AliIcon name="Harbor" /> }],
      },
      {
        key: "security-identity",
        label: "安全与身份",
        icon: <IconLock />,
        children: [{ key: "/api-keys", label: "API Key", icon: <AliIcon name="Ukeyguanli" /> }],
      },
    ],
  },
] as const;

export const productGroupSections = [
  {
    label: "资源与服务",
    groupKeys: ["work-instances", "storage-management", "network-management"],
  },
  {
    label: "AI算力服务",
    groupKeys: [
      // TODO(feature-visibility): 待 GPU 算力管理支持后恢复分组索引。
      // "compute-management",
      "cluster-management",
      "ai-services",
      // TODO(feature-visibility): 待知识库管理支持后恢复分组索引。
      // "knowledge-services",
    ],
  },
  { label: "公共服务", groupKeys: ["registry-management", "security-identity"] },
] as const satisfies readonly ProductGroupSection[];

export function isGroupItem(item: MenuItem): item is MenuItem & { children: MenuItem[] } {
  return Array.isArray(item.children) && item.children.length > 0;
}

/** 递归过滤隐藏菜单，并移除过滤后不含可见子项的分组。 */
export function visibleMenuItems(items: readonly MenuItem[]): MenuItem[] {
  return items.flatMap((item) => {
    if (item.hidden) return [];
    if (!isGroupItem(item)) return [item];

    const children = visibleMenuItems(item.children);
    return children.length ? [{ ...item, children }] : [];
  });
}

export function findMenuItem(key: string): MenuItem | undefined {
  return menuItems.find((item) => item.key === key);
}

/** 按菜单展示顺序递归查找第一个可访问的叶子路由。 */
export function firstLeafPath(item: MenuItem): string | null {
  if (item.hidden) return null;
  if (!isGroupItem(item)) return item.key.startsWith("/") ? item.key : null;
  for (const child of item.children) {
    const path = firstLeafPath(child);
    if (path) return path;
  }
  return null;
}

/** 根据当前 pathname 计算侧栏 Menu selectedKeys（最长前缀匹配）。 */
export function matchSideMenuKey(pathname: string, routeKeys: string[]): string[] {
  const exact = routeKeys.find((key) => key === pathname);
  if (exact) return [exact];
  const prefix = routeKeys
    .filter((key) => key !== "/" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  if (prefix) return [prefix];
  const submenu = openSubMenuKeysForPath(pathname)[0];
  return submenu ? [submenu] : ["/"];
}

const PATH_SUBMENU: { prefix: string; key: string }[] = [
  { prefix: "/ai-training", key: "ai-services" },
  { prefix: "/overview-compute", key: "compute-management" },
  { prefix: "/containers", key: "work-instances" },
  { prefix: "/vms", key: "work-instances" },
  { prefix: "/gpu-containers", key: "work-instances" },
  { prefix: "/sandboxes", key: "work-instances" },
  { prefix: "/gpu-inventory", key: "compute-management" },
  { prefix: "/k8s-clusters", key: "cluster-management" },
  { prefix: "/volumes", key: "storage-management" },
  { prefix: "/filesystems", key: "storage-management" },
  { prefix: "/objects", key: "storage-management" },
  { prefix: "/vector-stores", key: "storage-management" },
  { prefix: "/ai-models", key: "ai-services" },
  { prefix: "/ai-inference", key: "ai-services" },
  { prefix: "/ai-inference-policies", key: "ai-services" },
  { prefix: "/ai-api-keys", key: "ai-services" },
  { prefix: "/ai-finetuning", key: "ai-services" },
  { prefix: "/kb", key: "knowledge-services" },
  { prefix: "/vpcs", key: "network-management" },
  { prefix: "/subnets", key: "network-management" },
  { prefix: "/eips", key: "network-management" },
  { prefix: "/security-groups", key: "network-management" },
  { prefix: "/load-balancers", key: "network-management" },
  { prefix: "/registry", key: "registry-management" },
  { prefix: "/api-keys", key: "security-identity" },
];

/** 当前路由应展开的侧栏分组 keys。 */
export function openSubMenuKeysForPath(pathname: string): string[] {
  const hit = PATH_SUBMENU.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return hit ? [hit.key] : [];
}

/** 当前路由对应的一级导航 key。 */
export function activeTopNavKeyForPath(pathname: string): string {
  return pathname === "/" ? "/" : "products";
}

/** 一级导航对应的侧栏条目；没有侧栏时返回 null。 */
export function sidebarItemsForTopNavKey(key: string): MenuItem[] | null {
  const item = findMenuItem(key);
  if (!item) return null;
  return isGroupItem(item) ? item.children : null;
}

function menuItemMatchesPath(item: MenuItem, pathname: string): boolean {
  if (isGroupItem(item)) {
    return item.children.some((child) => menuItemMatchesPath(child, pathname));
  }
  return item.key === pathname || (item.key !== "/" && pathname.startsWith(`${item.key}/`));
}

function menuPathForPath(items: readonly MenuItem[], pathname: string): MenuItem[] | null {
  for (const item of items) {
    if (!menuItemMatchesPath(item, pathname)) continue;
    if (!isGroupItem(item)) return [item];

    const childPath = menuPathForPath(item.children, pathname);
    if (childPath) return [item, ...childPath];
  }
  return null;
}

/** 从导航配置生成详情页使用的分组与叶子菜单面包屑。 */
export function navigationBreadcrumbsForPath(pathname: string): NavigationBreadcrumbItem[] {
  const items = sidebarItemsForTopNavKey(activeTopNavKeyForPath(pathname));
  if (!items) return [];

  const path = menuPathForPath(items, pathname);
  if (!path) return [];

  return path.flatMap((item, index) => {
    if (item.label === path[index + 1]?.label) return [];
    return [{ label: item.label, ...(isGroupItem(item) ? {} : { to: item.key }) }];
  });
}

/** 当前路由对应的产品领域及其侧栏条目。 */
export function sidebarNavigationForPath(
  pathname: string,
): { label: string; items: MenuItem[] } | null {
  const items = sidebarItemsForTopNavKey(activeTopNavKeyForPath(pathname));
  if (!items) return null;

  const section = productGroupSections.find(({ groupKeys }) =>
    items.some(
      (item) =>
        groupKeys.some((groupKey) => groupKey === item.key) && menuItemMatchesPath(item, pathname),
    ),
  );

  if (!section) return { label: "计算产品与服务", items: visibleMenuItems(items) };

  return {
    label: section.label,
    items: visibleMenuItems(
      items.filter((item) => section.groupKeys.some((groupKey) => groupKey === item.key)),
    ),
  };
}
