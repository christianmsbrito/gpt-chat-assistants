export enum Roles {
  ADMIN = "Admin",
  CLIENT = "Client",
}

export enum Resources {
  LIST_CAMPAIGNS = "listCampaigns",
  GET_CAMPAIGN = "getCampaignDetails",
  ASSIGN_TO_CAMPAIGN = "assignToCampaign",
}

export enum BotErrorMessages {
  INVALID_COMMAND = "Commando inválido",
  INVALID_QUANTITY_TYPE = "A quantidade informada deve ser um número",
  UNKNOWN_ERROR = "Falha ao processar comando, por favor, tente novamente mais tarde.",
}

export enum CampaignStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  FINISHED = 'Finished',
}