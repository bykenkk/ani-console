import { Card, Descriptions, Empty, Table } from "@arco-design/web-react";
import type { ModelDevImplementation } from "@/api/modeldev";
import { getModelDevParameterLabel } from "@/lib/modeldev";

type ModelDevSummaryProps = {
  basicInfo: { label: string; value: string }[];
  implementation?: ModelDevImplementation;
  parameters: string[];
};

export default function ModelDevSummary({
  basicInfo,
  implementation,
  parameters,
}: ModelDevSummaryProps) {
  const parameterRows = (implementation?.parameter_rules ?? []).map((rule, index) => {
    const defaultValue = rule.default_value
      ? `默认值 ${rule.default_value.value}`
      : rule.editable === false
        ? "由系统管理"
        : "未填写";
    return {
      name: rule.name,
      label: getModelDevParameterLabel(rule.name),
      value: rule.editable === false ? defaultValue : parameters[index] || defaultValue,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Card bordered={false} title="基础信息">
        <Descriptions
          column={1}
          data={basicInfo.map((item) => ({
            label: item.label,
            value: <span className="whitespace-pre-wrap break-all">{item.value}</span>,
          }))}
        />
      </Card>
      <Card bordered={false} title="参数配置">
        {parameterRows.length ? (
          <Table
            rowKey="name"
            pagination={false}
            data={parameterRows}
            columns={[
              { title: "参数", width: 200, dataIndex: "label", ellipsis: true },
              { title: "值", width: 320, dataIndex: "value", ellipsis: true },
            ]}
          />
        ) : (
          <Empty description="没有可配置参数" />
        )}
      </Card>
    </div>
  );
}
