import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Select, Space } from "@arco-design/web-react";
import {
  getImageSpace,
  listImageRegistrations,
  unregisterImage,
  type ImageRegistration,
  type ImageRegistrationScope,
} from "@/api/images";
import { ApiError } from "@/api/request";
import type { ListPagination } from "@/components/common/DataTable";
import { ListPageFrame, ListDataTable, ResourceNameId, type ListColumn } from "@/components/common";
import { copyToClipboard } from "@/lib/clipboard";
import { formatDateTime } from "@/lib/format";
import { IMAGE_ACCELERATORS, IMAGE_PURPOSES } from "../options";
import RegisterImageModal from "../RegisterImageModal";
import EditImageRegistrationModal from "../EditImageRegistrationModal";
import ManageImageSpaceModal from "../ManageImageSpaceModal";

export default function RegistryPage() {
  const [scope, setScope] = useState<ImageRegistrationScope>("tenant");
  const [search, setSearch] = useState("");
  const [purposes, setPurposes] = useState<string[]>([]);
  const [accelerator, setAccelerator] = useState("");
  const [register, setRegister] = useState(false);
  const [edit, setEdit] = useState<ImageRegistration>();
  const [manage, setManage] = useState(false);
  const client = useQueryClient();
  const space = useQuery({
    queryKey: ["image-space"],
    queryFn: async ({ signal }) => {
      try {
        return await getImageSpace(signal);
      } catch (error) {
        // Space provisioning belongs to the platform; Console only reads its state.
        if (error instanceof ApiError && error.status === 404 && error.code === "SPACE_NOT_FOUND")
          return null;
        throw error;
      }
    },
    meta: {
      errorNotification: {
        id: "image-space",
        action: "镜像空间加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const filters = {
    scope,
    search: search.trim() || undefined,
    purposes,
    accelerator: accelerator || undefined,
  };
  const filterKey = JSON.stringify(filters);
  const [window, setWindow] = useState({
    filterKey,
    page: 1,
    pageSize: 10,
    cursors: [undefined] as Array<string | undefined>,
  });
  const current =
    window.filterKey === filterKey
      ? window
      : { ...window, filterKey, page: 1, cursors: [undefined] };
  if (window.filterKey !== filterKey) setWindow(current);
  const query = useQuery({
    queryKey: [
      "image-registrations",
      filters,
      { cursor: current.cursors[current.page - 1], limit: current.pageSize },
    ],
    queryFn: ({ signal }) =>
      listImageRegistrations(
        { ...filters, cursor: current.cursors[current.page - 1], limit: current.pageSize },
        signal,
      ),
    meta: {
      errorNotification: {
        id: "image-registrations",
        action: "镜像登记列表加载",
        fallback: "请求失败，请稍后重试",
      },
    },
  });
  const reset = () => setWindow((value) => ({ ...value, page: 1, cursors: [undefined] }));
  const refresh = () => {
    reset();
    return client.invalidateQueries({ queryKey: ["image-registrations"] });
  };
  const pagination: ListPagination = {
    // TODO(pagination-migration): 后端改为 page/pageSize 后移除此临时游标配置。
    mode: "legacy-cursor",
    page: current.page,
    pageSize: current.pageSize,
    hasNextPage: Boolean(query.data?.nextCursor),
    disabled: query.isFetching,
    onPageChange: (page) => {
      if (query.isFetching || page < 1 || page > current.page + 1) return;
      if (page > current.page) {
        if (!query.data?.nextCursor) return;
        setWindow({
          ...current,
          page,
          cursors: [...current.cursors.slice(0, current.page), query.data.nextCursor],
        });
      } else if (page === 1 || current.cursors[page - 1]) {
        setWindow({ ...current, page });
      }
    },
    onPageSizeChange: (pageSize) =>
      setWindow({ filterKey, page: 1, pageSize, cursors: [undefined] }),
  };
  const remove = useMutation({
    mutationFn: (image: ImageRegistration) =>
      unregisterImage(image.image_id, { expectedVersion: image.version }),
    meta: {
      feedback: {
        channel: "notification",
        id: "image-registration-unregister",
        action: "注销镜像登记",
        successText: "镜像登记已注销",
        errorFallback: "注销失败；如版本已变化，请刷新列表重试",
      },
    },
    onSuccess: async (_, image) => {
      reset();
      await client.invalidateQueries({ queryKey: ["image-registrations"] });
      await client.invalidateQueries({
        queryKey: ["image-registration", image.scope, image.image_id],
        refetchType: "none",
      });
    },
  });
  const columns: Array<ListColumn<ImageRegistration>> = [
    {
      key: "name",
      title: "名称 / ID",
      fixed: "left",
      width: 200,
      render: (_, image) => (
        <ResourceNameId name={image.displayName} id={image.image_id} openable={false} />
      ),
    },
    { key: "repository", title: "仓库", dataIndex: "repository", ellipsis: true, width: 180 },
    {
      key: "reference",
      title: "镜像地址",
      dataIndex: "resolvedReference",
      ellipsis: true,
      width: 280,
    },
    {
      key: "description",
      title: "描述",
      dataIndex: "description",
      ellipsis: true,
      width: 180,
    },
    {
      key: "purpose",
      title: "用途",
      width: 160,
      ellipsis: true,
      render: (_, image) =>
        image.purposes
          ?.map(
            (purpose) => IMAGE_PURPOSES.find((item) => item.value === purpose)?.label || purpose,
          )
          .join("、") || "-",
    },
    {
      key: "accelerator",
      title: "加速器",
      width: 120,
      render: (_, image) =>
        IMAGE_ACCELERATORS.find((item) => item.value === image.accelerator)?.label ||
        image.accelerator ||
        "-",
    },
    {
      key: "platforms",
      title: "平台架构",
      width: 180,
      ellipsis: true,
      render: (_, image) =>
        image.platforms
          ?.map((item) => [item.os, item.architecture, item.variant].filter(Boolean).join("/"))
          .join("、") || "-",
    },
    {
      key: "created",
      title: "登记时间",
      width: 180,
      render: (_, image) => formatDateTime(image.createdAt),
    },
  ];
  return (
    <>
      <ListPageFrame
        header={{
          iconClassName: "icon-moxing",
          title: "镜像仓库",
          subtitle: "管理镜像空间、发布凭证与镜像登记",
          extra: (
            <Space>
              <Button onClick={() => setManage(true)}>空间与凭证</Button>
              <Button
                type="primary"
                disabled={space.data?.state !== "available"}
                onClick={() => setRegister(true)}
              >
                登记镜像
              </Button>
            </Space>
          ),
        }}
        tabs={{
          value: scope,
          onChange: setScope,
          items: [
            { value: "tenant", label: "用户镜像" },
            { value: "platform", label: "平台镜像" },
          ],
        }}
        toolbar={{
          search: {
            fields: [{ value: "search", label: "关键词" }],
            field: "search",
            value: search,
            onFieldChange: () => {},
            onChange: setSearch,
            placeholder: "搜索镜像",
          },
          filters: (
            <Space>
              <Select
                mode="multiple"
                aria-label="用途筛选"
                placeholder="全部用途"
                allowClear
                value={purposes}
                onChange={setPurposes}
                options={IMAGE_PURPOSES}
                className="min-w-40"
              />
              <Select
                aria-label="加速器筛选"
                value={accelerator}
                onChange={setAccelerator}
                options={[{ value: "", label: "全部加速器" }, ...IMAGE_ACCELERATORS]}
                className="w-36"
              />
            </Space>
          ),
          refresh: { onClick: refresh, spinning: query.isFetching },
        }}
      >
        <ListDataTable
          data={query.data?.items ?? []}
          rowKey="image_id"
          columns={columns}
          loading={query.isFetching}
          pagination={pagination}
          tableLabel="镜像登记列表"
          rowActions={[
            {
              key: "copy",
              label: "复制拉取命令",
              onClick: (image) =>
                copyToClipboard(`docker pull ${image.resolvedReference}`, "拉取命令"),
            },
            {
              key: "edit",
              label: "编辑",
              visible: (image) => scope === "tenant" && image.scope === "tenant",
              disabled: () => remove.isPending,
              onClick: setEdit,
            },
            {
              key: "unregister",
              label: "注销登记",
              intent: "danger",
              visible: (image) => scope === "tenant" && image.scope === "tenant",
              disabled: () => remove.isPending,
              loading: (image) => remove.isPending && remove.variables?.image_id === image.image_id,
              onClick: (image) => {
                Modal.confirm({
                  title: "注销镜像登记",
                  content: `确定注销“${image.displayName}”？此操作移除镜像登记，不会删除仓库中的镜像 Tag。`,
                  okButtonProps: { status: "danger" },
                  onOk: () => remove.mutateAsync(image),
                });
              },
            },
          ]}
        />
      </ListPageFrame>
      {manage && (
        <ManageImageSpaceModal
          space={space.data}
          loading={space.isLoading}
          refreshing={space.isFetching}
          onRefresh={() => {
            space.refetch();
          }}
          onCancel={() => setManage(false)}
        />
      )}
      {register && (
        <RegisterImageModal
          onCancel={() => setRegister(false)}
          onCreated={() => {
            setRegister(false);
            reset();
          }}
        />
      )}
      {edit && <EditImageRegistrationModal image={edit} onCancel={() => setEdit(undefined)} />}
    </>
  );
}
