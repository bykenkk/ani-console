// FIXME(governance-migration): 当前镜像可读新详情，版本历史、更新镜像及回滚仍保留原组件、入口和 lifecycle 调用。
// TODO(governance-migration): 等版本及发布操作契约对齐后迁移，不把资源 version 当作发布修订。
import { type InstanceRecord, applyInstanceLifecycle } from "@/api/instances/legacy";
import type { InstanceRecord as CurrentInstanceRecord } from "@/api/instances";
import InstanceReleases from "@/components/instances/InstanceReleases";
import { Button, Modal } from "@arco-design/web-react";
import { useMutation } from "@tanstack/react-query";
import { type RowAction } from "@/components/common";

type InstanceVersionsProps = {
  instance?: InstanceRecord;
  currentImage?: Pick<CurrentInstanceRecord, "imageId" | "imageDigest">;
  loading?: boolean;
  onChanged: () => void;
  updateImage?: RowAction<InstanceRecord>;
  rollbackDisabled: boolean;
};

type Release = NonNullable<NonNullable<InstanceRecord["container"]>["history"]>[number];

export default function InstanceVersions({
  instance,
  currentImage,
  loading = false,
  onChanged,
  updateImage,
  rollbackDisabled,
}: InstanceVersionsProps) {
  const rollback = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "instance-release-rollback",
        action: "回滚",
        successText: "回滚已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async (release: Release) => {
      if (!instance) throw new Error("实例发布信息尚未加载");
      await applyInstanceLifecycle(instance.id, {
        action: "rollback",
        revision: release.revision,
      });
    },
    onSuccess: onChanged,
  });
  const confirmRollback = (release: Release) => {
    if (
      !instance ||
      rollbackDisabled ||
      rollback.isPending ||
      release.revision === instance.container?.revision
    )
      return;
    Modal.confirm({
      title: `回滚到 ${release.revision}`,
      content: `确定将「${instance.name}」回滚到版本 ${release.revision}？`,
      confirmLoading: rollback.isPending,
      onOk: () => rollback.mutateAsync(release),
    });
  };

  const actions: RowAction<Release>[] = [
    {
      key: "rollback",
      label: "回滚到此版本",
      disabled: (release) =>
        !instance ||
        rollbackDisabled ||
        rollback.isPending ||
        release.revision === instance.container?.revision,
      loading: (release) => rollback.isPending && rollback.variables?.revision === release.revision,
      onClick: confirmRollback,
    },
  ];

  return (
    <InstanceReleases
      instance={instance}
      currentImage={currentImage}
      loading={loading}
      versionLayout
      actions={
        <Button
          disabled={!instance || !updateImage || updateImage.disabled?.(instance)}
          onClick={() => {
            if (instance) updateImage?.onClick(instance);
          }}
        >
          更新镜像
        </Button>
      }
      revisionActions={actions}
    />
  );
}
