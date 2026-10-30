import type { Sandbox } from "@/api/sandboxes";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useSandboxActions } from "@/hooks/useSandboxActions";

type SandboxActionsProps = { sandbox: Sandbox; onDeleted: () => void };
export default function SandboxActions({ sandbox, onDeleted }: SandboxActionsProps) {
  const { actions } = useSandboxActions(onDeleted);
  return <ResourceActionMenu record={sandbox} actions={actions} />;
}
