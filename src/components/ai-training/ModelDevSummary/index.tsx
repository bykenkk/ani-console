import { Button, Card, Descriptions, Empty, Table } from "@arco-design/web-react";
import type { ModelDevImplementation } from "@/api/modeldev";
import { getModelDevParameterLabel } from "@/lib/modeldev";

type ModelDevSummaryProps = {
  basicInfo: { label: string; value: string }[];
  implementation?: ModelDevImplementation;
  parameters: string[];
  onEdit: (step: number) => void;
};

export default function ModelDevSummary({
  basicInfo,
  implementation,
  parameters,
  onEdit,
}: ModelDevSummaryProps) {
  const parameterRows = (implementation?.parameter_rules ?? []).map((rule, index) => ({
    name: rule.name,
    label: getModelDevParameterLabel(rule.name),
    value:
      parameters[index] || (rule.default_value ? `默认值 ${rule.default_value.value}` : "未填写"),
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card
        bordered={false}
        title="基础信息"
        extra={
          <Button type="text" size="small" onClick={() => onEdit(0)} aria-label="修改基础信息">
            修改
          </Button>
        }
      >
        <Descriptions
          column={1}
          data={basicInfo.map((item) => ({
            label: item.label,
            value: <span className="whitespace-pre-wrap break-all">{item.value}</span>,
          }))}
        />
      </Card>
      <Card
        bordered={false}
        title="参数配置"
        extra={
          <Button type="text" size="small" onClick={() => onEdit(1)} aria-label="修改参数配置">
            修改
          </Button>
        }
      >
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
