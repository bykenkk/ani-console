import { Form, InputNumber, Radio, Select } from "@arco-design/web-react";
import type { VmMedia } from "@/api/vms";
import { ComputePresetSelect } from "@/components/common";
import VmInitialDiskEditor from "../../VmInitialDiskEditor";
import type { VmCreateFormValues } from "..";

type VmComputeFieldsProps = {
  values: VmCreateFormValues;
  media: VmMedia[];
  loading: boolean;
};

export default function VmComputeFields({ values, media, loading }: VmComputeFieldsProps) {
  const fromImage = values.source_kind === "DISK_IMAGE";
  return (
    <>
      <Form.Item
        field="preset"
        label="实例规格"
        rules={[
          { required: true, message: "请选择实例规格" },
          {
            validator: (preset, cb) =>
              cb(
                preset && (!preset.enabled || !preset.selectable || preset.compute_type !== "cpu")
                  ? "请选择可用的 CPU 实例规格"
                  : undefined,
              ),
          },
        ]}
      >
        <ComputePresetSelect usage="VIRTUAL_MACHINE" computeType="cpu" />
      </Form.Item>
      <Form.Item field="source_kind" label="系统来源">
        <Radio.Group
          type="button"
          options={[
            { value: "DISK_IMAGE", label: "从镜像创建" },
            { value: "INSTALL_ISO", label: "通过 ISO 安装" },
          ]}
        />
      </Form.Item>
      <Form.Item
        field="media_key"
        label={fromImage ? "系统镜像" : "安装镜像（ISO）"}
        formatter={(key: string | undefined) => key || undefined}
        extra={
          fromImage ? "使用预装操作系统的磁盘镜像创建云主机。" : "创建后仍需完成操作系统安装。"
        }
        rules={[
          { required: true, message: fromImage ? "请选择系统镜像" : "请选择安装镜像" },
          {
            validator: (key, cb) =>
              cb(
                key &&
                  !media.some((item) => item.mediaKey === key && item.kind === values.source_kind)
                  ? "所选镜像已不可用，请重新选择"
                  : undefined,
              ),
          },
        ]}
      >
        <Select
          loading={loading}
          placeholder={fromImage ? "请选择系统镜像" : "请选择安装镜像（ISO）"}
          options={media
            .filter((item) => item.kind === values.source_kind)
            .map((item) => ({ value: item.mediaKey, label: item.name }))}
        />
      </Form.Item>
      <Form.Item
        field="system_disk_size_gb"
        label="系统盘容量"
        rules={[{ required: true, message: "请输入系统盘容量" }]}
      >
        <InputNumber
          min={1}
          max={9223372036}
          precision={0}
          suffix="GB"
          placeholder="请输入系统盘容量"
        />
      </Form.Item>
      <Form.Item label="数据盘">
        <VmInitialDiskEditor />
      </Form.Item>
    </>
  );
}
