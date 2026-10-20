import { Form, Input, Radio, Select, Descriptions, Button } from "@arco-design/web-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getAcceleratorCapacity,
  listAcceleratorProfiles,
  previewAcceleratorAdmission,
  type AcceleratorProfile,
} from "@/api/accelerator";
import type { InferenceGpuSelection } from "@/api/inference";
import { withId } from "@/lib/id";

export default function InferenceGpuFields({
  replicas,
  distributed,
  workerReplicas,
  onChange,
  onEnabledChange,
}: {
  replicas: number;
  distributed: boolean;
  workerReplicas: number;
  onChange: (gpu?: InferenceGpuSelection) => void;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [clusterId, setClusterId] = useState("");
  const [lookupClusterId, setLookupClusterId] = useState("");
  const [poolId, setPoolId] = useState("");
  const [pageToken, setPageToken] = useState<string>();
  const [previousTokens, setPreviousTokens] = useState<(string | undefined)[]>([]);
  const [selected, setSelected] = useState<AcceleratorProfile>();
  const profiles = useQuery({
    queryKey: ["accelerator-profiles", lookupClusterId, pageToken],
    enabled: enabled && Boolean(lookupClusterId) && lookupClusterId === clusterId.trim(),
    queryFn: ({ signal }) =>
      listAcceleratorProfiles({ cluster_id: lookupClusterId, page_token: pageToken }, signal),
    meta: {
      errorNotification: { id: withId("accelerator-profiles", clusterId), action: "GPU 规格加载" },
    },
  });
  useEffect(() => {
    const current = profiles.data?.items?.find(
      (item) =>
        item.profile_id === selected?.profile_id &&
        item.profile_version === selected.profile_version,
    );
    onChange(
      enabled && selected?.published && current?.published && clusterId.trim() && poolId.trim()
        ? {
            cluster_id: clusterId.trim(),
            pool_id: poolId.trim(),
            profile_id: selected.profile_id,
            profile_version: selected.profile_version,
          }
        : undefined,
    );
  }, [enabled, selected, clusterId, poolId, profiles.data, onChange]);
  return (
    <>
      <Form.Item label="加速器">
        <Radio.Group
          type="button"
          value={enabled ? "gpu" : "cpu"}
          onChange={(value) => {
            setEnabled(value === "gpu");
            onEnabledChange(value === "gpu");
            setSelected(undefined);
            onChange();
          }}
        >
          <Radio value="cpu">CPU</Radio>
          <Radio value="gpu">GPU</Radio>
        </Radio.Group>
      </Form.Item>
      {enabled && (
        <>
          <Form.Item
            field="gpu_cluster_id"
            label="GPU 集群 ID"
            rules={[{ type: "string", required: true, match: /\S/, message: "请输入 GPU 集群 ID" }]}
          >
            <Input
              placeholder="请输入 Accelerator 集群 ID"
              onChange={(value) => {
                setClusterId(value);
                setLookupClusterId("");
                setPageToken(undefined);
                setPreviousTokens([]);
                setSelected(undefined);
                onChange();
              }}
              onBlur={() => setLookupClusterId(clusterId.trim())}
            />
          </Form.Item>
          <Form.Item
            field="gpu_pool_id"
            label="GPU 资源池 ID"
            rules={[
              { type: "string", required: true, match: /\S/, message: "请输入 GPU 资源池 ID" },
            ]}
          >
            <Input placeholder="请输入该集群内的资源池 ID" onChange={setPoolId} />
          </Form.Item>
          <Form.Item
            field="gpu_profile"
            label="GPU 规格"
            formatter={() =>
              selected ? `${selected.profile_id}:${selected.profile_version}` : undefined
            }
            validateTrigger={[]}
            rules={[
              {
                validator: (_, callback) => {
                  const current = profiles.data?.items?.find(
                    (item) =>
                      item.profile_id === selected?.profile_id &&
                      item.profile_version === selected.profile_version,
                  );
                  if (!current?.published) callback("请选择已发布的 GPU 规格");
                  else callback();
                },
              },
            ]}
            extra="规格与资源池的匹配及配额以提交时的准入结果为准。"
          >
            <Select
              loading={profiles.isFetching}
              disabled={!lookupClusterId || lookupClusterId !== clusterId.trim()}
              placeholder="请选择 GPU 规格"
              showSearch
              value={selected ? `${selected.profile_id}:${selected.profile_version}` : undefined}
              options={(profiles.data?.items ?? []).map((item) => ({
                value: `${item.profile_id}:${item.profile_version}`,
                label: `${item.display_name || item.profile_id} · v${item.profile_version} · ${item.spec?.mode || "-"}`,
                disabled: !item.published,
              }))}
              onChange={(value) =>
                setSelected(
                  profiles.data?.items?.find(
                    (item) => `${item.profile_id}:${item.profile_version}` === value,
                  ),
                )
              }
            />
          </Form.Item>
          {(profiles.data?.next_page_token || previousTokens.length > 0) && (
            <div className="mb-4 flex gap-2">
              <Button
                disabled={profiles.isFetching || !previousTokens.length}
                onClick={() => {
                  setPageToken(previousTokens[previousTokens.length - 1]);
                  setPreviousTokens((current) => current.slice(0, -1));
                  setSelected(undefined);
                  onChange();
                }}
              >
                上一页规格
              </Button>
              <Button
                disabled={profiles.isFetching || !profiles.data?.next_page_token}
                onClick={() => {
                  setPreviousTokens((current) => [...current, pageToken]);
                  setPageToken(profiles.data!.next_page_token);
                  setSelected(undefined);
                  onChange();
                }}
              >
                下一页规格
              </Button>
            </div>
          )}
          {selected && (
            <InferenceGpuCapacity
              key={`${clusterId}:${poolId}:${selected.profile_id}:${selected.profile_version}:${replicas}:${distributed}:${workerReplicas}`}
              profile={selected}
              clusterId={clusterId.trim()}
              poolId={poolId.trim()}
              replicas={distributed ? replicas * (workerReplicas + 1) : replicas}
              containerName={distributed ? "main" : "kserve-container"}
            />
          )}
        </>
      )}
    </>
  );
}

function InferenceGpuCapacity({
  profile,
  clusterId,
  poolId,
  replicas,
  containerName,
}: {
  profile: AcceleratorProfile;
  clusterId: string;
  poolId: string;
  replicas: number;
  containerName: string;
}) {
  const capacity = useQuery({
    queryKey: ["accelerator-capacity", profile.profile_id, profile.profile_version],
    queryFn: ({ signal }) => getAcceleratorCapacity(profile, signal),
    meta: {
      errorNotification: {
        id: withId("accelerator-capacity", profile.profile_id),
        action: "GPU 容量加载",
      },
    },
  });
  const preview = useMutation({
    mutationFn: () =>
      previewAcceleratorAdmission({
        cluster_id: clusterId,
        pool_id: poolId,
        profile_id: profile.profile_id,
        profile_version: profile.profile_version,
        replicas,
        devices_per_replica: 1,
        container_name: containerName,
      }),
    meta: {
      feedback: {
        channel: "notification",
        id: "inference-gpu-preview",
        action: "GPU 准入预览",
        successText: "GPU 准入预览已更新",
        errorFallback: "预览失败",
      },
    },
  });
  return (
    <div className="mb-4">
      <Descriptions
        column={2}
        data={[
          { label: "已知空闲单位", value: capacity.data?.known_free_units ?? "-" },
          {
            label: "容量观测",
            value: capacity.data ? (capacity.data.observation?.complete ? "完整" : "不完整") : "-",
          },
          { label: "GPU Pod 数", value: replicas },
          { label: "GPU 匹配结果", value: preview.data?.gpu_fit ?? "-" },
          { label: "执行就绪状态", value: preview.data?.owner_execution_readiness ?? "-" },
          ...(preview.data?.quota_checks ?? []).map((item) => ({
            label: item.quota_code || "配额",
            value: `${item.requested ?? "-"} / ${item.available ?? "-"} · ${item.status || "-"}`,
          })),
          { label: "预览说明", value: preview.data?.reasons?.join("；") || "-" },
        ]}
      />
      <Button
        loading={preview.isPending}
        disabled={
          !poolId || !clusterId || !Number.isInteger(replicas) || replicas < 1 || replicas > 16
        }
        onClick={() => preview.mutate()}
      >
        检查 GPU 配额与容量
      </Button>
    </div>
  );
}
