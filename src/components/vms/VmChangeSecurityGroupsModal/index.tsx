import ChangeSecurityGroupsModal from "@/components/security-groups/ChangeSecurityGroupsModal";

type VmChangeSecurityGroupsModalProps = {
  instance: { id: string; name: string };
  onCancel: () => void;
  onSubmitted: (operationId: string) => void;
};
export default function VmChangeSecurityGroupsModal({
  instance,
  onCancel,
  onSubmitted,
}: VmChangeSecurityGroupsModalProps) {
  return (
    <ChangeSecurityGroupsModal
      targetType="vm"
      id={instance.id}
      name={instance.name}
      onCancel={onCancel}
      onSubmitted={onSubmitted}
    />
  );
}
