import SubnetAssociatedInstances from "./SubnetAssociatedInstances";
import SubnetVnics from "./SubnetVnics";

type SubnetRelatedResourcesProps = { subnetId: string };

export default function SubnetRelatedResources({ subnetId }: SubnetRelatedResourcesProps) {
  return (
    <section className="flex flex-col gap-6">
      <SubnetVnics subnetId={subnetId} />
      <SubnetAssociatedInstances subnetId={subnetId} />
    </section>
  );
}
