import ChangeSecurityGroupsModal from "@/components/security-groups/ChangeSecurityGroupsModal";

type ContainerChangeSecurityGroupsModalProps = {
  instance: { id: string; name: string };
  onCancel: () => void;
  onSubmitted: () => void;
};
export default function ContainerChangeSecurityGroupsModal({
  instance,
  onCancel,
  onSubmitted,
}: ContainerChangeSecurityGroupsModalProps) {
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
