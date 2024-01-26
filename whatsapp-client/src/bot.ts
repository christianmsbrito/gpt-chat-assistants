import { CoreApiService } from "services/core-api.service";
import * as venom from "venom-bot";

export interface ISendTextParameters {
  to: string;
  text: string;
  onSuccess?: <T, K>(data: K) => T | void;
  onError?: <T, K>(data: K) => T | void;
}

const sessions = new Map<string, string>();

export default class Bot {

  constructor(
    private readonly client: venom.Whatsapp,
    private readonly coreApiService: CoreApiService,
  ) { }

  start(): void {
    this.client.onMessage(this.handleCommand.bind(this));
  }

  private async handleCommand(message: venom.Message) {
    const isAllowedSender = message.from.includes('981035162') || message.from.includes('981553840');
    if (!message.isGroupMsg && isAllowedSender) {
      console.log("Message Received From Grande Pinto:", message);
      const replyMessage = { to: message.from } as ISendTextParameters;
      try {
        let threadId: string;
        if (sessions.has(message.from)) {
          threadId = sessions.get(message.from)!;
        } else {
          threadId = (await this.coreApiService.startNewThread()).thread_id;
          this.setSession(message.from, threadId);
        }

        const data = await this.coreApiService.generateChatResponse({
          content: message.content,
          threadId,
        });

        replyMessage.text = data.response;
      } catch (error: any) {
        Object.assign(replyMessage, {
          onSuccess: () => console.error(error),
          text: error.message ?? 'An error occurred',
        });
      } finally {
        await this.sendText(replyMessage);
      }

    }
  }

  private async sendText({
    to,
    text,
    onSuccess = () => { },
    onError = console.error,
  }: ISendTextParameters): Promise<void> {
    await this.client.sendText(to, text).then(onSuccess).catch(onError);
  }

  private setSession(sender: string, threadId: string): void {
    sessions.set(sender, threadId);
    setTimeout(() => {
      sessions.delete(sender);
    }, 60 * 60 * 1000); // 1 hour
  }
}