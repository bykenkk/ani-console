import NetworkInstanceAssociations from "@/components/network/NetworkInstanceAssociations";
import SubnetVnics from "./SubnetVnics";

type SubnetRelatedResourcesProps = { subnetId: string };

export default function SubnetRelatedResources({ subnetId }: SubnetRelatedResourcesProps) {
  return (
    <section className="flex flex-col gap-6">
      <SubnetVnics subnetId={subnetId} />
      <NetworkInstanceAssociations subnetId={subnetId} />
    </section>
  );
}
