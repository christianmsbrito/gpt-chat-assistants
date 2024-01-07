import {
  BotCommandsHandler,
  BotResource,
} from "./utils/decorators/dot-resource.decorator";
import * as venom from "venom-bot";
import { BotErrorMessages, Resources } from "./utils/enums";
import { BotResourceError } from "./utils/errors";
import {
  BotCommands,
  IAssignToCampaignParams,
  IGetCampaignDetailsParams,
} from "./utils/interfaces";

enum DefaultCommandsEnum {
  LIST_CAMPAIGNS = "campaigns",
  CAMPAIGN_DETAILS = "campaign",
  ASSIGN_TO_CAMPAIGN = "campaign-assign",
}

export const defaultCommands: Record<DefaultCommandsEnum, Resources> = {
  [DefaultCommandsEnum.LIST_CAMPAIGNS]: Resources.LIST_CAMPAIGNS,
  [DefaultCommandsEnum.CAMPAIGN_DETAILS]: Resources.GET_CAMPAIGN,
  [DefaultCommandsEnum.ASSIGN_TO_CAMPAIGN]: Resources.ASSIGN_TO_CAMPAIGN,
};

export interface ISendTextParameters {
  to: string;
  text: string;
  onSuccess?: <T, K>(data: K) => T | void;
  onError?: <T, K>(data: K) => T | void;
}

@BotCommandsHandler
export default class Bot implements BotCommands {
  private commands: Record<string, Resources>;

  constructor(
    private readonly client: venom.Whatsapp,
    commands?: Record<string, Resources>
  ) {
    this.commands = commands || defaultCommands;
  }

  start(): void {
    this.client.onMessage(this.handleCommand.bind(this));
  }

  @BotResource
  async listCampaigns(): Promise<void> {}

  @BotResource
  async getCampaignDetails(
    campaignName: string
  ): Promise<IGetCampaignDetailsParams> {
    return {
      campaignName,
    };
  }

  @BotResource
  async assignToCampaign(
    campaignName: string,
    userName: string,
    quantity: string,
    data: venom.Message
  ): Promise<IAssignToCampaignParams> {
    if (Number.isNaN(Number(quantity))) {
      throw new BotResourceError(BotErrorMessages.INVALID_QUANTITY_TYPE);
    }

    return {
      campaignName,
      userName,
      phoneNumber: data.from,
      quantity: quantity,
    };
  }

  private validateCommand(command: string): {
    commandName: Resources;
    args: string[];
  } {
    const [, commandLine = ""] = command.split("!");

    const BLANK_SPACES_REGEX = /\s+/g;
    const [commandName, ...args] = commandLine.split(BLANK_SPACES_REGEX);

    if (!commandName || !(commandName in this.commands)) {
      throw new Error("Command is invalid");
    }

    return {
      commandName: this.commands[commandName],
      args,
    };
  }

  private async runCommand(
    commandName: Resources,
    args: string[],
    data: venom.Message
  ): Promise<unknown> {
    switch (commandName) {
      case Resources.LIST_CAMPAIGNS:
        return this.listCampaigns();
      case Resources.GET_CAMPAIGN:
        return this.getCampaignDetails(args[0]);
      case Resources.ASSIGN_TO_CAMPAIGN:
        return this.assignToCampaign(args[0], args[1], args[2], data);
    }
  }

  private async handleCommand(message: venom.Message) {
    if (message.body?.startsWith("!") && !message.isGroupMsg) {
      const replyMessage = { to: message.from } as ISendTextParameters;
      try {
        const { commandName, args } = this.validateCommand(message.body);

        const content = await this.runCommand(commandName, args, message);

        replyMessage.text = content as string;
      } catch (error: any) {
        const isBotResourceError = error instanceof BotResourceError;

        Object.assign(replyMessage, {
          onSuccess: isBotResourceError
            ? undefined
            : () => console.error(error),
          text: isBotResourceError
            ? error.message
            : BotErrorMessages.UNKNOWN_ERROR,
        });
      } finally {
        await this.sendText(replyMessage);
      }
    }
  }

  private async sendText({
    to,
    text,
    onSuccess = () => {},
    onError = console.error,
  }: ISendTextParameters): Promise<void> {
    await this.client.sendText(to, text).then(onSuccess).catch(onError);
  }
}
