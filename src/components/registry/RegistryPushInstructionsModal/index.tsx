import { Button, Modal, Space, Typography } from "@arco-design/web-react";
import type { ImageSpace } from "@/api/images";
import { copyToClipboard } from "@/lib/clipboard";

export default function RegistryPushInstructionsModal({
  space,
  onCancel,
}: {
  space: ImageSpace;
  onCancel: () => void;
}) {
  const target = `${space.registryAuthority}/${space.projectName}/app:latest`;
  const commands = [
    {
      label: "登录仓库（按提示输入发布用户名和密钥）",
      command: `docker login ${space.registryAuthority}`,
    },
    {
      label: "标记镜像（将 local-image:latest 替换为本地镜像）",
      command: `docker tag local-image:latest ${target}`,
    },
    { label: "推送镜像", command: `docker push ${target}` },
  ];
  return (
    <Modal visible title="推送镜像说明" footer={null} onCancel={onCancel} style={{ width: 720 }}>
      <Typography.Paragraph>
        先签发并保存发布凭证，再在本地终端执行以下示例命令。推送成功后返回镜像仓库，点击“登记镜像”并填写推送地址。
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        示例使用仓库 app、Tag latest，可按实际镜像调整。网页不直接上传镜像文件。
      </Typography.Paragraph>
      <Space direction="vertical" className="w-full" size="large">
        {commands.map(({ label, command }) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between">
              <Typography.Text>{label}</Typography.Text>
              <Button type="text" size="small" onClick={() => copyToClipboard(command, "命令")}>
                复制
              </Button>
            </div>
            <Typography.Text code className="break-all">
              {command}
            </Typography.Text>
          </div>
        ))}
      </Space>
    </Modal>
  );
}
