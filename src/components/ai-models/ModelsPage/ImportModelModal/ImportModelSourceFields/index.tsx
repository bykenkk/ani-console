import { withFirst100 } from "@/api/pagination";
import { Form, Input, Select } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react/es/Form";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  searchExternalModels,
  type ExternalModelCandidate,
  type ImportModelInput,
} from "@/api/models";

const searchModelOptions = withFirst100(searchExternalModels);

export interface ImportModelSourceValues {
  source: ImportModelInput["source"];
  repo_id: string;
  model_name: string;
  display_name: string;
  description: string;
  revision: string;
}

function modelNameFromCandidate(candidate: ExternalModelCandidate): string {
  const normalized = candidate.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 63);
  return normalized || "model";
}

export default function ImportModelSourceFields({
  form,
}: {
  form: Pick<FormInstance<ImportModelSourceValues>, "setFieldsValue">;
}) {
  const [source, setSource] = useState<ImportModelSourceValues["source"]>("huggingface");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selected, setSelected] = useState<ExternalModelCandidate>();
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchKeyword(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  // FIXME(model-contract): 用户确认保留原分支外部搜索，目标部署版本尚待确认。
  // TODO(model-contract): 目标版本就绪后联调来源切换、仓库选择及搜索取消。
  const search = useQuery({
    queryKey: ["external-models", "options", source, searchKeyword],
    enabled: searchKeyword.length >= 2,
    queryFn: ({ signal }) => searchModelOptions({ source, keyword: searchKeyword }, signal),
    meta: {
      errorNotification: {
        id: "external-model-search",
        action: "外部模型搜索",
        fallback: "模型搜索失败，请稍后重试",
      },
    },
  });
  const candidates = search.data?.items ?? [];
  const options =
    selected && !candidates.some((item) => item.repo_id === selected.repo_id)
      ? [selected, ...candidates]
      : candidates;
  return (
    <>
      <Form.Item field="source" label="来源" rules={[{ required: true, message: "请选择来源" }]}>
        <Select
          options={[
            { value: "huggingface", label: "HuggingFace" },
            { value: "modelscope", label: "ModelScope" },
          ]}
          onChange={(value) => {
            setSource(value);
            setSelected(undefined);
            setSearchInput("");
            setSearchKeyword("");
            form.setFieldsValue({
              repo_id: undefined,
              model_name: "",
              display_name: "",
              description: "",
              revision: value === "modelscope" ? "master" : "main",
            });
          }}
        />
      </Form.Item>
      <Form.Item
        field="repo_id"
        label="外部模型"
        rules={[{ required: true, message: "请选择搜索结果中的模型" }]}
        extra="输入至少两个字符搜索并选择仓库"
      >
        <Select
          key={source}
          showSearch
          filterOption={false}
          placeholder="搜索模型名称或仓库 ID"
          loading={search.isFetching}
          onSearch={setSearchInput}
          options={options.map((candidate) => ({
            value: candidate.repo_id,
            label: (candidate.display_name || candidate.name) + " · " + candidate.repo_id,
          }))}
          onChange={(repoId) => {
            const candidate = options.find((item) => item.repo_id === repoId);
            if (!candidate) return;
            setSelected(candidate);
            form.setFieldsValue({
              repo_id: candidate.repo_id,
              model_name: modelNameFromCandidate(candidate),
              display_name: candidate.display_name || candidate.name,
              description: candidate.description || "",
              revision: candidate.revision,
            });
          }}
        />
      </Form.Item>
      <Form.Item
        field="model_name"
        label="模型名称"
        rules={[
          { required: true, message: "请输入模型名称" },
          {
            match: /^[a-z0-9.-]{1,63}$/,
            message: "模型名称只能包含小写字母、数字、点和短横线，最多 63 个字符",
          },
        ]}
      >
        <Input maxLength={63} placeholder="选择外部模型后可修改名称" />
      </Form.Item>
    </>
  );
}
