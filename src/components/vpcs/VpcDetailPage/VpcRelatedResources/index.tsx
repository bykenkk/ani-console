import type { NetworkOwnerScope } from "@/api/network";
import VpcAssociatedInstances from "./VpcAssociatedInstances";
import VpcRelatedSubnets from "./VpcRelatedSubnets";
import VpcRelatedLoadBalancers from "./VpcRelatedLoadBalancers";

type VpcRelatedResourcesProps = { vpcId: string; ownerScope: NetworkOwnerScope };

export default function VpcRelatedResources({ vpcId, ownerScope }: VpcRelatedResourcesProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <section>
        <VpcRelatedSubnets vpcId={vpcId} />
      </section>
      {ownerScope === "tenant" && (
        <section>
          <VpcRelatedLoadBalancers vpcId={vpcId} />
        </section>
      )}
      <section>
        <VpcAssociatedInstances vpcId={vpcId} />
      </section>
    </div>
  );
}
