import { parseIpRanges } from "@/lib/subnets";
import { optionalIpv4, optionalIpv4WithinCidr } from "@/lib/validators";

function splitIpEntries(value: string): string[] {
  return value
    .split(/[,\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseSubnetExcludedIps(value: string, cidr: string): string[] {
  return splitIpEntries(value).map((entry) => {
    const bounds = entry.split("..").map((ip) => ip.trim());
    if (bounds.length > 2 || bounds.some((ip) => !ip)) {
      throw new Error("排除 IP 请填写单个 IPv4 地址或 起始IP..结束IP");
    }
    for (const ip of bounds) optionalIpv4WithinCidr(ip, cidr, "排除 IP", "子网 CIDR");
    if (!parseIpRanges(bounds.join("-"))) throw new Error("排除 IP 的起始地址不能大于结束地址");
    return bounds.join("..");
  });
}

export function parseSubnetDnsServers(value: string): string[] {
  return splitIpEntries(value).map((entry) => {
    optionalIpv4(entry, "DNS 服务器");
    return entry;
  });
}
