import clsx from "clsx";
import { useState } from "react";
import InstanceEvents from "@/components/instances/InstanceEvents";
import SandboxSecurityEvents from "../SandboxSecurityEvents";

type SandboxEventsProps = { instanceId: string };

type EventTab = "all" | "security";

export default function SandboxEvents({ instanceId }: SandboxEventsProps) {
  const [activeTab, setActiveTab] = useState<EventTab>("all");

  return (
    <div>
      <div
        className="box-border grid h-6.5 w-[min(165px,100%)] grid-cols-2 overflow-hidden rounded-sm border border-solid border-app-border-strong bg-app-surface"
        role="tablist"
        aria-label="事件类型"
      >
        {[
          { key: "all" as const, label: "全部" },
          { key: "security" as const, label: "安全" },
        ].map((item) => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              className={clsx(
                "relative cursor-pointer border-0 px-3 py-0 text-center [font:inherit] text-[14px]! font-semibold! leading-6.5! focus-visible:outline-2! focus-visible:outline-solid! focus-visible:outline-app-primary! focus-visible:-outline-offset-3 [&+button]:[border-left:1px_solid_var(--color-border-2)]",
                active
                  ? "bg-(--color-primary-light-1) text-app-primary after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-5.5 after:-translate-x-1/2 after:bg-app-primary after:content-['']"
                  : "bg-transparent text-app-text [&:hover]:text-app-primary",
              )}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4" role="tabpanel">
        {activeTab === "all" ? (
          <>
            {/* TODO(sandbox-instance-events): 普通事件已迁移公共组件；Governance 沙箱事件及实例 ID 对齐并联调后传入 ID，再移除此标记。 */}
            <InstanceEvents />
          </>
        ) : (
          <SandboxSecurityEvents instanceId={instanceId} />
        )}
      </div>
    </div>
  );
}
