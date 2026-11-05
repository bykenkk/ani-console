import { VpcSelect, SubnetSelect } from "@/components/common";
import { createFilesystemMountTarget } from "@/api/storage/filesystems";
import { Alert, Form, Modal } from "@arco-design/web-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type CreateFilesystemMountTargetModalProps = {
  filesystemId: string;
  onCancel: () => void;
};

export default function CreateFilesystemMountTargetModal({
  filesystemId,
  onCancel,
}: CreateFilesystemMountTargetModalProps) {
  const qc = useQueryClient();
  const [vpcId, setVpcId] = useState("");
  const [subnetId, setSubnetId] = useState("");
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建挂载点",
        successText: "挂载点创建已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async (_: undefined) => {
      if (!vpcId) throw new Error("请选择 VPC");
      if (!subnetId) throw new Error("请选择子网");
      return createFilesystemMountTarget(filesystemId, { vpc_id: vpcId, subnet_id: subnetId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["filesystem-mounts", filesystemId] });
      qc.invalidateQueries({ queryKey: ["filesystems"] });
      onCancel();
    },
  });

  return (
    <Modal
      visible
      title="创建挂载点"
      onCancel={onCancel}
      onOk={() => create.mutateAsync(undefined)}
      confirmLoading={create.isPending}
      unmountOnExit
    >
      <Alert
        type="info"
        showIcon
        title="挂载点为指定 VPC 和子网分配文件存储访问地址。同一 VPC 内的实例可通过该地址挂载。"
      />
      <Form layout="vertical" className="mt-2">
        <Form.Item label="VPC" required>
          <VpcSelect
            value={vpcId || undefined}
            onChange={(id) => {
              setVpcId(id ?? "");
              setSubnetId("");
            }}
          />
        </Form.Item>
        <Form.Item label="子网" required>
          <SubnetSelect
            key={vpcId}
            vpcId={vpcId}
            value={subnetId || undefined}
            onChange={(id) => setSubnetId(id ?? "")}
            disabled={!vpcId}
            placeholder={vpcId ? "请选择子网" : "请先选择 VPC"}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
