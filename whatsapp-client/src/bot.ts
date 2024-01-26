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


  private messageAccruals: Map<string, { timer: NodeJS.Timeout | null, messages: venom.Message[] }> = new Map();

  private async handleCommand(message: venom.Message) {
    const isAllowedSender = message.from.includes('981035162') || message.from.includes('981553840');
    if (!message.isGroupMsg && isAllowedSender) {
      console.log("Message Received From Valid Source");
      this.accrueMessages(message);
    }
  }

  private accrueMessages(message: venom.Message) {
    const sender = message.from;
    const currentTime = new Date().getTime();

    if (this.messageAccruals.has(sender)) {
      const accruedData = this.messageAccruals.get(sender)!;
      accruedData.messages.push(message);
      clearTimeout(accruedData.timer!); // Clear the previous timer
    } else {
      this.messageAccruals.set(sender, {
        timer: null,
        messages: [message],
      });
    }

    // Set a new timer for processing accrued messages
    const timer = setTimeout(() => {
      const messages = this.messageAccruals.get(sender)?.messages;
      if (messages) {
        this.processAccruedMessages(messages).then(() => {
          this.messageAccruals.delete(sender);
        });
      }
    }, 30000); // 30 seconds

    // Store the timer in the messages array
    const messages = this.messageAccruals.get(sender);
    if (messages) {
      messages.timer = timer;
    }
  }

  private async processAccruedMessages(messages: venom.Message[]) {
    // Process the accrued messages here
    console.log("Accrued Messages:", messages.length);

    const message = messages.map(m => m.content).join('\n');

    const replyMessage = { to: messages[0].from } as ISendTextParameters;
    try {
      let threadId: string;
      if (sessions.has(messages[0].from)) {
        threadId = sessions.get(messages[0].from)!;
      } else {
        threadId = (await this.coreApiService.startNewThread()).thread_id;
        this.setSession(messages[0].from, threadId);
      }

      const data = await this.coreApiService.generateChatResponse({
        content: message,
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