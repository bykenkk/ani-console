import { useQuery } from "@tanstack/react-query";
import { Tag } from "@arco-design/web-react";
import {
  getNetworkSubnet,
  getNetworkVpc,
  type NetworkSubnet,
  type NetworkVPC,
} from "@/api/network";
import { ResourceNameId } from "@/components/common";
import { withId } from "@/lib/id";

type NetworkReferenceNameProps = {
  kind: "vpc" | "subnet";
  id: string;
  name?: string;
};

export default function NetworkReferenceName({ kind, id, name }: NetworkReferenceNameProps) {
  const resource = useQuery<NetworkVPC | NetworkSubnet>({
    queryKey: [kind === "vpc" ? "network-vpc" : "network-subnet", id],
    queryFn: () => (kind === "vpc" ? getNetworkVpc(id) : getNetworkSubnet(id)),
    meta: {
      errorNotification: {
        id: withId(kind, id),
        action: kind === "vpc" ? "VPC 加载" : "子网加载",
      },
    },
  });
  return (
    <div className="flex flex-col items-start gap-1">
      <ResourceNameId name={resource.data?.name || name || id} id={id} type={kind} />
      {resource.data?.owner_scope === "platform" && <Tag color="arcoblue">平台基础网络</Tag>}
    </div>
  );
}
