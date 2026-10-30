import ChangeSecurityGroupsModal from "@/components/security-groups/ChangeSecurityGroupsModal";

type GpuContainerChangeSecurityGroupsModalProps = {
  instance: { id: string; name: string };
  onCancel: () => void;
  onSubmitted: () => void;
};
export default function GpuContainerChangeSecurityGroupsModal({
  instance,
  onCancel,
  onSubmitted,
}: GpuContainerChangeSecurityGroupsModalProps) {
  return (
    <ChangeSecurityGroupsModal
      targetType="instance"
      id={instance.id}
      name={instance.name}
      onCancel={onCancel}
      onSubmitted={onSubmitted}
    />
  );
}
