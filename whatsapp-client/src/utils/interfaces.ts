import { CampaignStatus, Resources, Roles } from "./enums";

interface MongoDocument {
  _id?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRole extends MongoDocument {
  name: Roles;
}

export interface IUser extends MongoDocument {
  name: string;
  phone: string;
  email?: string;
  role?: IRole | any;
}

export interface ICampaign {
  name: string;
  description?: string;
  // medias?: Array<IMedia>;
  product: IProduct | any;
  rules: ICampaignRule[];
  status: CampaignStatus;
  minimum_quantity: number;
  total_ordered: number;
}

export interface ICampaignRule {
  minimumQuantity: number;
  maximumQuantity: number;
  promoPrice: number;
}

export interface IMedia {
  type: string;
  url: string;
}

export interface IUserCampaign extends MongoDocument {
  user: IUser | any;
  campaign: ICampaign | any;
  quantity: number;
  paid_amount: number;
  rule: ICampaignRule | any;
}

export interface IAssignToCampaignParams {
  campaignName: string;
  userName: string;
  quantity: string;
  phoneNumber: string;
}

export interface IGetCampaignDetailsParams {
  campaignName: string;
}

export interface BotClient {
  create: <T, K>(config: K) => Promise<T>;
}

export interface BotCommands extends Record<Resources, Function> {}

export interface IProduct extends MongoDocument {
  name: string;
  description?: string;
  medias?: Array<IMedia>;
  user: IUser | any;
  is_active: boolean;
  unit_price: number;
}
