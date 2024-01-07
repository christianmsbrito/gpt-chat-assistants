import {
  ICampaign,
  BotCommands,
  ICampaignRule,
  IUserCampaign,
} from "../utils/interfaces";

class CommunicationService implements BotCommands {
  private getRulesTable(rules: ICampaignRule[]): string {
    return rules
      .map(
        (rule) =>
          `${rule.minimumQuantity} - ${
            rule.maximumQuantity
          } = $${rule.promoPrice.toFixed(2)}`
      )
      .join("\n");
  }

  private removeExtraSpaces(text: string): string {
    const markLineBreak = text
      .split("\n")
      .map((line) => (/^\s*$/g.test(line) ? "<line-break>" : line))
      .join("\n");
    return markLineBreak.replace(/^\s+/gim, "").replace(/^<line-break>$/gim, "");
  }

  listCampaigns(campaigns: ICampaign[]): string {
    const message = `== *Campanhas Ativas* ==\n${campaigns
      .map(
        (campaign) =>
          `*${campaign.name}*\n
          ${this.getRulesTable(campaign.rules)}\n`
      )
      .join("\n-----------------------------------------\n")}`;

    return this.removeExtraSpaces(message);
  }

  getCampaignDetails(campaign: ICampaign): string {
    const message = `== *${campaign.name}* ==\n
    ${campaign.description}\n
    ${campaign.product?.name}\n
    ${this.getRulesTable(campaign.rules)}`;

    return this.removeExtraSpaces(message);
  }

  assignToCampaign(userCampaign: IUserCampaign): string {
    return `Campanha assinada com successo!\nProduto: ${userCampaign.campaign.product.name}\nQuantidade: ${userCampaign.quantity}`;
  }
}

export const communicationService = new CommunicationService();
