import { Collapse, Form } from "@arco-design/web-react";
import InstanceKeyValueEditor from "../InstanceKeyValueEditor";

type ContainerRuntimeFieldsProps = {
  metadataExpanded: boolean;
  onMetadataExpandedChange: (expanded: boolean) => void;
};

export default function ContainerRuntimeFields({
  metadataExpanded,
  onMetadataExpandedChange,
}: ContainerRuntimeFieldsProps) {
  const { disabled } = Form.useFormContext();
  return (
    <>
      <Form.Item label="环境变量" extra="最多 64 项。变量值可留空，按原文提交。">
        <InstanceKeyValueEditor field="env" nameLabel="变量名" maxItems={64} />
      </Form.Item>
      <Collapse
        bordered={false}
        lazyload={false}
        destroyOnHide={false}
        activeKey={metadataExpanded ? ["metadata"] : []}
        onChange={(_, keys) => onMetadataExpandedChange(keys.includes("metadata"))}
      >
        <Collapse.Item name="metadata" header="实例元数据" disabled={disabled}>
          <Form.Item label="标签">
            <InstanceKeyValueEditor field="labels" nameLabel="标签键" maxItems={32} />
          </Form.Item>
          <Form.Item label="注解" extra="标签和注解各最多 32 项，键和值合计不超过 16 KiB。">
            <InstanceKeyValueEditor field="annotations" nameLabel="注解键" maxItems={32} />
          </Form.Item>
        </Collapse.Item>
      </Collapse>
    </>
  );
}
