import { VpcSelect, SubnetSelect } from "@/components/common";
// TODO(submit-result): governance 对接后确认创建挂载点所需 ID 的取得方式，再清理创建响应和无人使用的 onCreated 回传。
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, InputNumber, Modal, Select } from "@arco-design/web-react";
import { useState } from "react";
import {
  createFilesystem,
  createFilesystemMountTarget,
  type StorageFilesystem,
} from "@/api/storage/filesystems";

type CreateFilesystemModalProps = {
  onCancel: () => void;
  onCreated?: (filesystem: Filesystem) => void;
};

type Filesystem = StorageFilesystem;
type FilesystemProtocol = "nfs";
type FilesystemPerformanceMode = "standard" | "throughput";

export default function CreateFilesystemModal({ onCancel, onCreated }: CreateFilesystemModalProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState<FilesystemProtocol>("nfs");
  const [performanceMode, setPerformanceMode] = useState<FilesystemPerformanceMode>("standard");
  const [sizeGiB, setSizeGiB] = useState(100);
  const [vpcId, setVpcId] = useState("");
  const [subnetId, setSubnetId] = useState("");
  const create = useMutation({
    meta: {
      feedback: {
        channel: "message",
        action: "创建文件存储",
        successText: "文件存储创建已提交",
        errorFallback: "请求失败",
      },
    },
    mutationFn: async (_: undefined) => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("请输入文件存储名称");
      if (!Number.isInteger(sizeGiB) || sizeGiB < 1) throw new Error("容量必须是大于 0 的整数");
      if (!vpcId) throw new Error("请选择 VPC");
      if (!subnetId) throw new Error("请选择子网");
      const createData = {
        name: trimmedName,
        protocol,
        performance_mode: performanceMode,
        size_gib: sizeGiB,
      };
      const data = await createFilesystem(createData);
      const mountTargetData = { vpc_id: vpcId, subnet_id: subnetId };
      await createFilesystemMountTarget(data.id, mountTargetData);
      return data;
    },
    onSuccess: (filesystem) => {
      qc.invalidateQueries({ queryKey: ["filesystems"] });
      onCreated?.(filesystem);
      onCancel();
    },
  });
  return (
    <Modal
      visible
      title="创建文件存储"
      onCancel={onCancel}
      onOk={() => create.mutateAsync(undefined)}
      confirmLoading={create.isPending}
      unmountOnExit
    >
      <Form layout="vertical">
        <Form.Item label="名称" required>
          <Input
            value={name}
            onChange={setName}
            placeholder="请输入文件存储名称"
            maxLength={64}
            showWordLimit
          />
        </Form.Item>
        <Form.Item label="协议" required>
          <Select value={protocol} onChange={setProtocol}>
            <Select.Option value="nfs">NFS</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="性能模式" required>
          <Select value={performanceMode} onChange={setPerformanceMode}>
            <Select.Option value="standard">标准型</Select.Option>
            <Select.Option value="throughput">吞吐型</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="容量" required>
          <InputNumber
            value={sizeGiB}
            min={1}
            precision={0}
            suffix="GiB"
            className="w-full"
            onChange={(value) => setSizeGiB(Number(value ?? 1))}
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
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
              placeholder={vpcId ? "请选择挂载目标子网" : "请先选择 VPC"}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
