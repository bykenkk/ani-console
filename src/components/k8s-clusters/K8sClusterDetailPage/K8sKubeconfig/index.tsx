import { useKubeconfigDownload } from "@/hooks/useKubeconfigDownload";

import { Button } from "@arco-design/web-react";

type K8sKubeconfigProps = { clusterId: string };

export default function K8sKubeconfig({ clusterId }: K8sKubeconfigProps) {
  const download = useKubeconfigDownload();

  return (
    <Button type="primary" loading={download.isPending} onClick={() => download.mutate(clusterId)}>
      下载 Kubeconfig
    </Button>
  );
}
