import { VpcSelect, SubnetSelect } from "@/components/common";
import { Collapse, Form, Input } from "@arco-design/web-react";
import type { InstanceEnvVar } from "@/api/instances";
import SecurityGroupSelect from "@/components/common/SecurityGroupSelect";
import InstanceKeyValueEditor from "@/components/instances/InstanceKeyValueEditor";
import InstanceVolumeMountEditor from "@/components/instances/InstanceVolumeMountEditor";
import {
  validateConfigSize,
  validateKeyValues,
  validateMountPath,
  validateVolumeMounts,
} from "./utils";

type ContainerResourceFieldsProps = {
  values: {
    workspace_mount_path: string;
    vpc_id: string;
    security_group_ids: string[];
    labels: InstanceEnvVar[];
    annotations: InstanceEnvVar[];
  };
  onVpcChange: (id: string) => void;
};

export default function ContainerResourceFields({
  values,
  onVpcChange,
}: ContainerResourceFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 items-start gap-4">
        <Form.Item
          field="vpc_id"
          label="VPC"
          rules={
            values.security_group_ids.length
              ? [{ required: true, message: "绑定安全组时请选择 VPC" }]
              : undefined
          }
        >
          <VpcSelect
            allowClear
            canUse
            placeholder="不配置网络"
            onChange={(id) => onVpcChange(id ?? "")}
          />
        </Form.Item>
        <Form.Item
          field="subnet_id"
          label="子网"
          rules={values.vpc_id ? [{ required: true, message: "请选择子网" }] : undefined}
        >
          <SubnetSelect
            key={values.vpc_id}
            vpcId={values.vpc_id}
            allowClear
            canUse
            disabled={!values.vpc_id}
          />
        </Form.Item>
      </div>
      <Form.Item field="security_group_ids" label="安全组" extra="可多选；留空表示不绑定安全组。">
        <SecurityGroupSelect />
      </Form.Item>
      <Form.Item
        field="workspace_mount_path"
        label="工作目录"
        rules={[
          { required: true, message: "请输入工作目录" },
          { validator: (value, callback) => callback(validateMountPath(value)) },
        ]}
      >
        <Input placeholder="/workspace" />
      </Form.Item>
      <Form.Item
        field="volume_mounts"
        label="存储卷挂载"
        extra="最多挂载 8 个已有存储卷。删除实例仅解除挂载，不删除用户存储卷。"
        rules={[
          {
            validator: (value, callback) =>
              callback(validateVolumeMounts(value ?? [], values.workspace_mount_path)),
          },
        ]}
      >
        <InstanceVolumeMountEditor />
      </Form.Item>
      <Collapse defaultActiveKey={["runtime"]}>
        <Collapse.Item header="运行配置" name="runtime">
          <Form.Item
            field="env"
            label="环境变量"
            extra="最多 64 项；值按原文提交，不去除空格或展开变量。"
            rules={[
              {
                validator: (value, callback) =>
                  callback(
                    validateKeyValues(value ?? [], 64) ??
                      validateConfigSize(
                        (value ?? []).map((row: InstanceEnvVar) => ({
                          name: "",
                          value: row.value,
                        })),
                      ),
                  ),
              },
            ]}
          >
            <InstanceKeyValueEditor nameLabel="变量名" maxItems={64} />
          </Form.Item>
          <Form.Item
            field="labels"
            label="标签"
            rules={[
              {
                validator: (value, callback) =>
                  callback(
                    validateKeyValues(value ?? [], 32) ??
                      validateConfigSize([...(value ?? []), ...values.annotations]),
                  ),
              },
            ]}
          >
            <InstanceKeyValueEditor nameLabel="标签键" maxItems={32} />
          </Form.Item>
          <Form.Item
            field="annotations"
            label="注解"
            extra="标签和注解各最多 32 项，键和值合计不超过 16 KiB。"
            rules={[
              {
                validator: (value, callback) =>
                  callback(
                    validateKeyValues(value ?? [], 32) ??
                      validateConfigSize([...values.labels, ...(value ?? [])]),
                  ),
              },
            ]}
          >
            <InstanceKeyValueEditor nameLabel="注解键" maxItems={32} />
          </Form.Item>
        </Collapse.Item>
      </Collapse>
    </>
  );
}
