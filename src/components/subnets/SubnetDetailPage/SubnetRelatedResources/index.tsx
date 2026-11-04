import NetworkAssociatedInstances from "@/components/network/NetworkAssociatedInstances";
import SubnetVnics from "./SubnetVnics";

type SubnetRelatedResourcesProps = { subnetId: string };

export default function SubnetRelatedResources({ subnetId }: SubnetRelatedResourcesProps) {
  return (
    <section className="flex flex-col gap-6">
      <SubnetVnics subnetId={subnetId} />
      <NetworkAssociatedInstances scope="subnet" resourceId={subnetId} />
    </section>
  );
}
