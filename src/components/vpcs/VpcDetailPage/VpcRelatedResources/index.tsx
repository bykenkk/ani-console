import type { NetworkOwnerScope } from "@/api/network";
import NetworkInstanceAssociations from "@/components/network/NetworkInstanceAssociations";
import VpcSubnets from "../VpcSubnets";
import VpcLoadBalancers from "./VpcLoadBalancers";

type VpcRelatedResourcesProps = { vpcId: string; ownerScope: NetworkOwnerScope };

export default function VpcRelatedResources({ vpcId, ownerScope }: VpcRelatedResourcesProps) {
  return (
    <div className="flex flex-col gap-6">
      <VpcSubnets vpcId={vpcId} />
      {ownerScope === "tenant" && <VpcLoadBalancers vpcId={vpcId} />}
      <NetworkInstanceAssociations vpcId={vpcId} />
    </div>
  );
}
