export interface IChatRequest {
  content: string;
  threadId: string;
  // fromMe: boolean;
  // timestamp: number;
  // type: string;
}

export interface IChatResponse {
  response: string;
}

export interface IStartNewThreadResponse {
  thread_id: string;
}

// export interface IGetCampaignDetailsParams {
//   campaignName: string;
// }

export interface BotClient {
  create: <T, K>(config: K) => Promise<T>;
}
