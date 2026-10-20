import { type InstanceRecord } from "@/api/instances/legacy";
import { Button, Space } from "@arco-design/web-react";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useSandboxActions } from "@/hooks/useSandboxActions";

type SandboxActionsProps = {
  instance: InstanceRecord;
  onChanged: () => void;
  onDeleted?: () => void;
  display?: "row" | "detail";
};

export default function SandboxActions({ instance, onChanged, onDeleted }: SandboxActionsProps) {
  const { actions, dialogNode } = useSandboxActions(onChanged, onDeleted);
  const primaryAction = actions.find((action) => action.key === "terminal");
  return (
    <>
      <Space>
        <Button
          type="primary"
          disabled={!primaryAction || primaryAction.disabled?.(instance)}
          loading={primaryAction?.loading?.(instance)}
          onClick={() => primaryAction?.onClick(instance)}
        >
          远程终端
        </Button>
        <ResourceActionMenu
          record={instance}
          actions={actions.filter((action) => action.key !== "terminal")}
        />
      </Space>
      {dialogNode}
    </>
  );
}
