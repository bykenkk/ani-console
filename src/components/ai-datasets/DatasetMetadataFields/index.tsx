import { Form, Input } from "@arco-design/web-react";

type DatasetMetadataFieldsProps = {
  allowEmptyDescription?: boolean;
};

export default function DatasetMetadataFields({
  allowEmptyDescription = true,
}: DatasetMetadataFieldsProps) {
  return (
    <>
      <Form.Item
        field="name"
        label="名称"
        rules={[
          { required: true, message: "请输入数据集名称" },
          {
            validator: (value: string | undefined, callback) => {
              if (value && (value !== value.trim() || /\p{Cc}/u.test(value)))
                return callback("名称不能包含首尾空白或控制字符");
              if (value && value !== value.normalize("NFC"))
                return callback("名称必须使用 NFC 规范化字符");
              callback(value && [...value].length > 128 ? "名称最多 128 个字符" : undefined);
            },
          },
        ]}
      >
        <Input placeholder="请输入数据集名称" />
      </Form.Item>
      <Form.Item
        field="description"
        label="描述"
        extra={allowEmptyDescription ? undefined : "当前不支持清空已有描述"}
        rules={[
          {
            validator: (value: string | undefined, callback) => {
              if (!allowEmptyDescription && !value) return callback("当前不支持清空已有描述");
              if (value && /\p{Cc}/u.test(value.replace(/[\r\n]/g, "")))
                return callback("描述允许换行，不能包含其他控制字符");
              callback(value && [...value].length > 4000 ? "描述最多 4000 个字符" : undefined);
            },
          },
        ]}
      >
        <Input.TextArea placeholder="请输入描述（可选）" autoSize={{ minRows: 3, maxRows: 6 }} />
      </Form.Item>
    </>
  );
}
