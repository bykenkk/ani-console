import { Collapse, Form, Input, Select } from "@arco-design/web-react";
import { useQuery } from "@tanstack/react-query";
import { listNetworkVpcs, listNetworkSubnets } from "@/api/network";
import type { InstanceEnvVar } from "@/api/instances";
import { withFirst100 } from "@/api/pagination";
import { withId } from "@/lib/id";
import InstanceKeyValueEditor from "@/components/instances/InstanceKeyValueEditor";
import InstanceVolumeMountEditor from "@/components/instances/InstanceVolumeMountEditor";
import {
  validateConfigSize,
  validateKeyValues,
  validateMountPath,
  validateVolumeMounts,
} from "./utils";

const listVpcOptions = withFirst100(listNetworkVpcs);

type InstanceCreateResourceFieldsProps = {
  values: {
    workspace_mount_path: string;
    vpc_id: string;
    labels: InstanceEnvVar[];
    annotations: InstanceEnvVar[];
  };
  onVpcChange: (id: string) => void;
};

export default function InstanceCreateResourceFields({
  values,
  onVpcChange,
}: InstanceCreateResourceFieldsProps) {
  const vpcs = useQuery({
    queryKey: ["network-vpcs", "instance-create", "options"],
    queryFn: ({ signal }) => listVpcOptions({ state: "RESOURCE_STATE_AVAILABLE" }, signal),
    meta: { errorNotification: { id: "instance-vpc-options", action: "VPC 加载" } },
  });
  const subnets = useQuery({
    queryKey: ["network-subnets", "instance-create", values.vpc_id, "options"],
    enabled: Boolean(values.vpc_id),
    // FIXME(instance-subnet-options): 子网尚无 page/pageSize，当前沿用旧分页契约，仅取首批 100 项。
    // TODO(instance-subnet-options): 后端完成分页改造后使用 withFirst100；不自动遍历后续游标。
    queryFn: ({ signal }) => listNetworkSubnets({ vpc_id: values.vpc_id, limit: 100 }, signal),
    meta: {
      errorNotification: {
        id: withId("instance-subnet-options", values.vpc_id),
        action: "子网加载",
      },
    },
  });
  return (
    <>
      <div className="grid grid-cols-2 items-start gap-4">
        <Form.Item field="vpc_id" label="VPC">
          <Select
            allowClear
            showSearch
            placeholder="不配置网络"
            loading={vpcs.isFetching}
            options={(vpcs.data?.items ?? []).map((vpc) => ({
              value: vpc.id,
              label: `${vpc.name} · ${vpc.cidr}`,
            }))}
            onChange={(id) => onVpcChange(id ?? "")}
          />
        </Form.Item>
        <Form.Item
          field="subnet_id"
          label="子网"
          rules={values.vpc_id ? [{ required: true, message: "请选择子网" }] : undefined}
        >
          <Select
            allowClear
            showSearch
            disabled={!values.vpc_id}
            loading={subnets.isFetching}
            placeholder={values.vpc_id ? "请选择子网" : "请先选择 VPC"}
            options={(subnets.data?.items ?? []).map((subnet) => ({
              value: subnet.id,
              label: `${subnet.name} · ${subnet.cidr}`,
            }))}
          />
        </Form.Item>
      </div>
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
