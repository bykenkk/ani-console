import { VpcSelect, SubnetSelect } from "@/components/common";
import LoadBalancerPrivateIpField from "../LoadBalancerPrivateIpField";
import { Form, Grid } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import { useEffect, useState } from "react";
import type { NetworkVPC } from "@/api/network";

import type { LoadBalancerConfigurationFormValues } from "@/components/load-balancers/CreateLoadBalancerModal";
import LoadBalancerPublicIpField from "@/components/load-balancers/LoadBalancerPublicIpField";
import VpcBaseConnectivityStatus from "@/components/vpcs/VpcBaseConnectivityStatus";

type LoadBalancerNetworkFieldsProps = {
  form: Pick<
    FormInstance<LoadBalancerConfigurationFormValues>,
    "setFieldsValue" | "setFieldValue" | "getFieldValue"
  >;
  scheme: LoadBalancerConfigurationFormValues["scheme"];
  onAvailabilityChange: (available: boolean) => void;
};

export default function LoadBalancerNetworkFields({
  form,
  scheme,
  onAvailabilityChange,
}: LoadBalancerNetworkFieldsProps) {
  const [selectedVpc, setSelectedVpc] = useState<NetworkVPC>();
  const vpcId = selectedVpc?.id;
  useEffect(() => {
    if (scheme === "public") {
      form.setFieldValue("vip", undefined);
      onAvailabilityChange(true);
    }
  }, [scheme, form, onAvailabilityChange]);
  return (
    <>
      <Form.Item noStyle shouldUpdate={(previous, next) => previous.scheme !== next.scheme}>
        {(values) =>
          (values.scheme === "public" || values.scheme === "both") && <LoadBalancerPublicIpField />
        }
      </Form.Item>
      <Grid.Row>
        <Grid.Col span={12} style={{ paddingRight: 8, minWidth: 0 }}>
          <Form.Item label="VPC" field="vpc_id" rules={[{ required: true, message: "请选择 VPC" }]}>
            <VpcSelect
              canManage
              onChange={(_, vpc) => {
                setSelectedVpc(vpc);
                onAvailabilityChange(scheme === "public");
                form.setFieldsValue({ subnet_id: undefined, vip: "", listeners: [] });
              }}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col span={12} style={{ paddingLeft: 8, minWidth: 0 }}>
          <Form.Item
            label="子网"
            field="subnet_id"
            rules={[{ required: true, message: "请选择子网" }]}
          >
            <SubnetSelect
              key={vpcId}
              vpcId={vpcId}
              canManage
              placeholder={vpcId ? "请选择用于 VIP 的子网" : "请先选择 VPC"}
              disabled={!vpcId}
              allowClear
              onChange={() => {
                form.setFieldValue("vip", "");
                onAvailabilityChange(scheme === "public");
              }}
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
      {selectedVpc && (
        <Form.Item label="基础网络">
          <VpcBaseConnectivityStatus connectivity={selectedVpc.base_connectivity} />
        </Form.Item>
      )}
      <Form.Item noStyle shouldUpdate={(previous, next) => previous.subnet_id !== next.subnet_id}>
        {(values) =>
          scheme !== "public" && (
            <LoadBalancerPrivateIpField
              key={values.subnet_id ?? "none"}
              subnetId={values.subnet_id}
              form={form}
              onAvailabilityChange={onAvailabilityChange}
            />
          )
        }
      </Form.Item>
    </>
  );
}
