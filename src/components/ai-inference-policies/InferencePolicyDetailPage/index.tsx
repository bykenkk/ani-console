import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AliIcon, DetailPageFrame, DetailPagePlaceholder, ResourceId } from "@/components/common";
import ResourceActionMenu from "@/components/common/ResourceActionMenu";
import { useBackOrFallback } from "@/hooks/useBackOrFallback";
import { getInferencePolicy } from "@/api/inference-policies";
import { useQuery } from "@tanstack/react-query";
import { withId } from "@/lib/id";
import { navigationBreadcrumbsForPath } from "@/layouts/AppLayout/navigation";
import InferencePolicyRules from "../InferencePolicyRules";
import SaveInferencePolicyModal from "../SaveInferencePolicyModal";
import DeleteInferencePolicyModal from "../DeleteInferencePolicyModal";

type InferencePolicyDetailPageProps = { policyId: string };

export default function InferencePolicyDetailPage({ policyId }: InferencePolicyDetailPageProps) {
  const [action, setAction] = useState<"edit" | "delete">();
  const navigate = useNavigate();
  const goBack = useBackOrFallback("inference-policy");
  const policy = useQuery({
    queryKey: ["governance-inference-policy", policyId],
    queryFn: ({ signal }) => getInferencePolicy(policyId, signal),
    enabled: Boolean(policyId),
    meta: {
      errorNotification: {
        id: withId("inference-policy", policyId),
        action: "访问策略详情加载",
      },
    },
  });
  if (!policy.data) return <DetailPagePlaceholder loading={policy.isLoading} />;
  const item = policy.data;
  return (
    <>
      <DetailPageFrame
        breadcrumbs={[
          ...navigationBreadcrumbsForPath("/ai-inference-policies"),
          { label: item.name },
        ]}
        title={item.name}
        icon={<AliIcon name="anquanzu" size={28} />}
        headerItems={[{ label: "策略 ID", value: item.id }]}
        actions={
          <ResourceActionMenu
            record={item}
            actions={[
              { key: "edit", label: "编辑", onClick: () => setAction("edit") },
              {
                key: "delete",
                label: "删除",
                intent: "danger",
                onClick: () => setAction("delete"),
              },
            ]}
          />
        }
        cards={[
          {
            key: "basic",
            title: "基本信息",
            fields: [
              { label: "名称", value: item.name },
              { label: "ID", value: <ResourceId value={item.id} /> },
              { label: "版本", value: item.version },
            ],
          },
          {
            key: "related",
            title: "关联摘要",
            fields: [
              { label: "授权模型数量", value: item.allowed_model_names.length },
              { label: "模型 API Key", value: <Link to="/ai-api-keys">前往管理</Link> },
            ],
          },
        ]}
        tabs={[{ key: "rules", label: "规则", content: <InferencePolicyRules policy={item} /> }]}
        onBack={goBack}
      />
      {action === "edit" && (
        <SaveInferencePolicyModal
          policy={item}
          onCancel={() => setAction(undefined)}
          onSaved={() => setAction(undefined)}
        />
      )}
      {action === "delete" && (
        <DeleteInferencePolicyModal
          policy={item}
          onCancel={() => setAction(undefined)}
          onDeleted={() => navigate({ to: "/ai-inference-policies", replace: true })}
        />
      )}
    </>
  );
}
