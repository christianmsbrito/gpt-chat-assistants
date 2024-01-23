import got, { Got, Method } from "got";
import {
  IChatRequest,
  IChatResponse,
  IStartNewThreadResponse,
} from "../utils/interfaces";

export class CoreApiService {
  httpClient: Got;
  constructor(baseUrl: string, apiKey: string) {
    this.httpClient = got.extend({
      prefixUrl: baseUrl,
      // resolveBodyOnly: true,
      headers: {
        apiKey,
      },
    });
  }

  protected async makeRequest<T = void>(options: {
    method: Method;
    path: string;
    body?: Record<string, unknown>;
    query?: Record<string, string>;
  }): Promise<T> {
    return this.httpClient(options.path, {
      method: options.method,
      json: options.body,
      searchParams: options.query,
    }).then(({ body = "{}" }) => JSON.parse(body) as T);
  }

  async generateChatResponse({
    content,
    threadId,
  }: IChatRequest): Promise<IChatResponse> {
    return this.makeRequest({
      method: "POST",
      path: "chat",
      body: {
        "thread_id": threadId,
        "message": content
      },
    });
  }

  async startNewThread(): Promise<IStartNewThreadResponse> {
    return this.makeRequest({
      method: "GET",
      path: "start",
    });
  }
}
