import { useState } from "react";
import { Alert, Button, Descriptions, Divider, Modal, Space, Spin } from "@arco-design/web-react";
import type { ImageSpace } from "@/api/images";
import { formatDateTime } from "@/lib/format";
import { IMAGE_SPACE_STATES } from "../options";
import ImagePublisherCredential from "../ImagePublisherCredential";
import RegistryPushInstructionsModal from "../RegistryPushInstructionsModal";

type ManageImageSpaceModalProps = {
  space: ImageSpace | null | undefined;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onCancel: () => void;
};

export default function ManageImageSpaceModal({
  space,
  loading,
  refreshing,
  onRefresh,
  onCancel,
}: ManageImageSpaceModalProps) {
  const [push, setPush] = useState(false);
  return (
    <Modal visible title="镜像空间与凭证" footer={null} onCancel={onCancel} style={{ width: 680 }}>
      <Space direction="vertical" className="w-full" size="large">
        <Space>
          <Button loading={refreshing} onClick={onRefresh}>
            刷新空间
          </Button>
          <Button disabled={space?.state !== "available"} onClick={() => setPush(true)}>
            推送说明
          </Button>
        </Space>
        <Spin loading={loading} className="w-full">
          <Descriptions
            column={1}
            data={[
              {
                label: "空间状态",
                value: space
                  ? IMAGE_SPACE_STATES[space.state] || space.state
                  : space === null
                    ? "暂未就绪，请联系平台管理员"
                    : "-",
              },
              { label: "项目名称", value: space?.projectName || "-" },
              { label: "仓库地址", value: space?.registryAuthority || "-" },
              {
                label: "创建时间",
                value: space?.createdAt ? formatDateTime(space.createdAt) : "-",
              },
            ]}
          />
        </Spin>
        {space?.state === "blocked" && (
          <Alert type="warning" content={space.reason || "镜像空间暂不可用，请联系平台管理员。"} />
        )}
        {space?.state === "provisioning" && (
          <Alert type="info" content="镜像空间准备中，状态将自动刷新。" />
        )}
        {space && (
          <>
            <Divider className="my-0!" />
            <ImagePublisherCredential available={space.state === "available"} />
          </>
        )}
      </Space>
      {push && space && (
        <RegistryPushInstructionsModal space={space} onCancel={() => setPush(false)} />
      )}
    </Modal>
  );
}
