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
    if (!message.isGroupMsg && message.from.includes('981035162')) {
      console.log("Message Received From Grande Pinto:", message);
      const replyMessage = { to: message.from } as ISendTextParameters;
      try {
        // const requestBody = {
        //   thread_id: "thread_lUkCTJzEamrPi72GqfyD7M6a",
        //   message: message.content,
        // };

        // const response = await axios.post("http://localhost:8080/chat", requestBody);
        // Assign the "response" attribute returned in the response to a constant
        // Use the responseAttribute as needed
        // const content = response.data?.response;

        // replyMessage.text = content as string;
      } catch (error: any) {
        Object.assign(replyMessage, {
          onSuccess: () => console.error(error),
          text: error.message ?? 'An error occurred',
        });
      } finally {
        // this.client.
        // await this.sendText(replyMessage);
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
}
