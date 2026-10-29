import { externalAxios, toApiError } from "@/api/request";

export interface InferenceChatInput {
  model: string;
  messages: { role: "user"; content: string }[];
  max_tokens: number;
  stream: false;
}

export interface InferenceChatResponse {
  choices: {
    message: { content?: string | null; reasoning_content?: string | null };
    finish_reason?: string | null;
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// 推理响应本身即测试结果，保留返回体；该接口未声明客户端幂等字段，不自动重试。
export async function invokeInferenceChat(
  invocationEndpoint: string | undefined,
  input: InferenceChatInput,
  secret: string,
  signal: AbortSignal,
): Promise<InferenceChatResponse> {
  try {
    if (!invocationEndpoint) throw new Error("推理服务未提供调用地址");
    // runtime 提供 completions 地址，聊天请求使用同一网关下的 chat/completions。
    const chatEndpoint = invocationEndpoint.replace(/\/v1\/completions$/, "/v1/chat/completions");
    const response = await externalAxios.post<InferenceChatResponse>(chatEndpoint, input, {
      headers: { "x-api-key": secret },
      withCredentials: false,
      signal,
      timeout: 120_000,
    });
    return response.data;
  } catch (error) {
    if (signal.aborted) throw error;
    throw toApiError(error);
  }
}
