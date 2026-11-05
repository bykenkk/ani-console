import AssociatedInstances from "./AssociatedInstances";
import SubnetVnics from "./SubnetVnics";

type RelatedResourcesProps = { subnetId: string };

export default function RelatedResources({ subnetId }: RelatedResourcesProps) {
  return (
    <section className="flex flex-col gap-6">
      <SubnetVnics subnetId={subnetId} />
      <AssociatedInstances subnetId={subnetId} />
    </section>
  );
}
