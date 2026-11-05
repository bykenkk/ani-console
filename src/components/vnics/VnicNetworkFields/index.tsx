import { useState } from "react";
import { Form } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import { VpcSelect, SubnetSelect } from "@/components/common";

type VnicNetworkFieldsProps = {
  form: Pick<FormInstance, "setFieldValue">;
  onSubnetChange: (id: string) => void;
};
export default function VnicNetworkFields({ form, onSubnetChange }: VnicNetworkFieldsProps) {
  const [vpcId, setVpcId] = useState("");
  return (
    <>
      <Form.Item field="vpc" label="VPC" rules={[{ required: true, message: "请选择 VPC" }]}>
        <VpcSelect
          canUse
          onChange={(id) => {
            setVpcId(id ?? "");
            onSubnetChange("");
            form.setFieldValue("subnet", undefined);
          }}
        />
      </Form.Item>
      <Form.Item field="subnet" label="子网" rules={[{ required: true, message: "请选择子网" }]}>
        <SubnetSelect
          key={vpcId}
          vpcId={vpcId}
          canUse
          onChange={(id) => onSubnetChange(id ?? "")}
          disabled={!vpcId}
        />
      </Form.Item>
    </>
  );
}
