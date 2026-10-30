import { Dropdown, Menu } from "@arco-design/web-react";
import { IconDown, IconPlus } from "@arco-design/web-react/icon";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { AliIcon } from "@/components/common";
import GpuQuota from "../GpuQuota";
import styles from "../index.module.css";

const homeQuickCreateItems = [
  { id: "create-vm", name: "创建云主机", icon: "yunzhuji", route: "/vms" },
  {
    id: "create-container",
    name: "创建容器",
    icon: "rongqishili",
    route: "/containers",
  },
  {
    id: "create-gpu",
    name: "创建 GPU 容器",
    icon: "GPUrongqishili",
    route: "/gpu-containers",
  },
  {
    id: "create-sandbox",
    name: "创建沙箱",
    icon: "Sandbox",
    route: "/sandboxes",
  },
  // {
  //   id: "create-k8s",
  //   name: "创建 K8s 集群",
  //   icon: "jiqun",
  //   route: "/k8s-clusters",
  // },
] as const;

export default function WelcomePanel() {
  const quickCreateMenu = (
    <Menu className={styles.quickCreateMenu}>
      {homeQuickCreateItems.map((item) => (
        <Menu.Item key={item.id}>
          <Link to={item.route} className={styles.quickCreateLink}>
            <AliIcon name={item.icon} size={16} />
            <span>{item.name}</span>
          </Link>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <section className={clsx(styles.panel, styles.welcomePanel)} aria-label="用户快捷入口">
      <div className={styles.greetingRow}>
        <div className={styles.avatar}>AI</div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <strong className="truncate text-[18px] leading-6">欢迎使用 AI 专有云</strong>
          <span className="truncate leading-5.5 text-(--home-text-secondary)">
            管理您的计算与 AI 资源
          </span>
        </div>
        <Dropdown trigger="click" position="br" droplist={quickCreateMenu}>
          <button
            type="button"
            className="inline-flex h-8 flex-none cursor-pointer items-center gap-2 rounded-sm border-0 bg-(--home-primary) px-4 py-0 text-[rgba(255,255,255,0.94)] [font:inherit] font-bold! leading-[inherit]! [&:hover]:bg-(--home-primary-hover) [@media(max-width:760px)]:ml-18"
          >
            <IconPlus aria-hidden="true" />
            <span>快捷创建</span>
            <IconDown aria-hidden="true" />
          </button>
        </Dropdown>
      </div>

      <GpuQuota />
    </section>
  );
}
