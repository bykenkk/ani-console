import { AutoComplete, Input, Select } from "@arco-design/web-react";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  searchExternalModels,
  type ExternalModelCandidate,
  type ImportModelInput,
} from "@/api/models";

export interface ModelSourceValue {
  source: ImportModelInput["source"];
  repo_id: string;
}

interface ModelSourceInputProps {
  value?: ModelSourceValue;
  onChange?: (value: ModelSourceValue, candidate?: ExternalModelCandidate) => void;
  disabled?: boolean;
}

export default function ModelSourceInput({ value, onChange, disabled }: ModelSourceInputProps) {
  const source = value?.source ?? "modelscope";
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selected, setSelected] = useState<ExternalModelCandidate>();
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchKeyword(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  // FIXME(model-contract): 用户确认保留原分支外部搜索，目标部署版本尚待确认。
  // TODO(model-contract): 目标版本就绪后联调来源切换、仓库选择及搜索取消。
  // 外部模型搜索受第三方接口限制，经确认作为选项分页例外，仅请求第 1 页、30 条，不使用 withFirst100。
  // TODO(external-model-search): 外部接口限制调整后复核此例外；不自动拉取后续页。
  const search = useQuery({
    queryKey: ["external-models", "options", source, searchKeyword, { page: 1, pageSize: 30 }],
    enabled: searchKeyword.length >= 2,
    queryFn: ({ signal }) =>
      searchExternalModels({ source, keyword: searchKeyword, page: 1, pageSize: 30 }, signal),
    meta: {
      errorNotification: {
        id: "external-model-search",
        action: "外部模型搜索",
        fallback: "模型搜索失败，请稍后重试",
      },
    },
  });
  const isSearching =
    searchInput.trim().length >= 2 && (searchInput.trim() !== searchKeyword || search.isFetching);
  const candidates = search.data?.items ?? [];
  const options =
    selected && !candidates.some((item) => item.repo_id === selected.repo_id)
      ? [selected, ...candidates]
      : candidates;
  return (
    <Input.Group compact>
      <Select
        aria-label="来源"
        placeholder="请选择来源"
        style={{ width: 140 }}
        value={source}
        disabled={disabled}
        options={[
          { value: "modelscope", label: "ModelScope" },
          { value: "huggingface", label: "HuggingFace" },
        ]}
        onChange={(source) => {
          setSelected(undefined);
          setSearchInput("");
          setSearchKeyword("");
          onChange?.({ source, repo_id: "" });
        }}
      />
      <AutoComplete
        key={source}
        style={{ width: "calc(100% - 140px)" }}
        inputProps={{ "aria-label": "外部模型" }}
        value={value?.repo_id ?? ""}
        disabled={disabled}
        defaultActiveFirstOption={false}
        filterOption={false}
        placeholder="请输入外部模型仓库 ID"
        loading={isSearching}
        onSearch={setSearchInput}
        data={options.map((candidate) => ({
          value: candidate.repo_id,
          name: (candidate.display_name || candidate.name) + " · " + candidate.repo_id,
        }))}
        onChange={(repo_id) => {
          if (repo_id !== selected?.repo_id) setSelected(undefined);
          onChange?.({ source, repo_id });
        }}
        onSelect={(repo_id) => {
          const candidate = options.find((item) => item.repo_id === repo_id);
          if (!candidate) return;
          setSelected(candidate);
          onChange?.({ source, repo_id }, candidate);
        }}
      />
    </Input.Group>
  );
}
