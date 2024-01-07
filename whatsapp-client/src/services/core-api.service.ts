import got, { Got, Method } from "got";
import {
  BotCommands,
  IAssignToCampaignParams,
  ICampaign,
  IGetCampaignDetailsParams,
} from "../utils/interfaces";

class CoreApiService implements BotCommands {
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

  async listCampaigns(): Promise<ICampaign[]> {
    return this.makeRequest<ICampaign[]>({
      method: "GET",
      path: "campaigns",
    });
  }

  async getCampaignDetails({
    campaignName,
  }: IGetCampaignDetailsParams): Promise<ICampaign> {
    return this.makeRequest<ICampaign>({
      method: "GET",
      path: `campaigns/${campaignName}`,
    });
  }

  async assignToCampaign({
    campaignName,
    userName,
    quantity,
    phoneNumber,
  }: IAssignToCampaignParams): Promise<void> {
    return this.makeRequest({
      method: "POST",
      path: `campaigns/${campaignName}/assign`,
      body: {
        phoneNumber,
        userName: userName,
        quantity: quantity,
      },
    });
  }
}

export const coreApiService = new CoreApiService(
  process.env.CORE_API_URL || "",
  process.env.BOT_API_KEY || ""
);
