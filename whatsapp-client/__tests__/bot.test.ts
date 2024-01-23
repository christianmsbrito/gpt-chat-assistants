// import { communicationService } from "../src/services/communication.service";
// import { coreApiService } from "../src/services/core-api.service";
// import { ICampaign } from "../src/utils/interfaces";
// import venom from "venom-bot";
// import Bot from "../src/bot";
// import { Resources } from "../src/utils/enums";

// const spyCommunicationServiceListCampaigns = jest.spyOn(
//   communicationService,
//   Resources.LIST_CAMPAIGNS
// );

// const spyCommunicationServiceGetCampaignDetails = jest.spyOn(
//   communicationService,
//   Resources.GET_CAMPAIGN
// );

// const spyCommunicationServiceAssignToCampaigns = jest.spyOn(
//   communicationService,
//   Resources.ASSIGN_TO_CAMPAIGN
// );

// const spyCoreApiServiceListCampaigns = jest.spyOn(
//   coreApiService,
//   Resources.LIST_CAMPAIGNS
// );

// const spyCoreApiServiceGetCampaignDetails = jest.spyOn(
//   coreApiService,
//   Resources.GET_CAMPAIGN
// );

// const spyCoreApiServiceAssignToCampaigns = jest.spyOn(
//   coreApiService,
//   Resources.ASSIGN_TO_CAMPAIGN
// );

// const clientMock = {
//   onMessage: async (fn: Function) => await fn(),
//   sendText: jest.fn().mockResolvedValue(""),
// } as unknown as jest.Mocked<venom.Whatsapp>;

// const mockCampaign = {
//   name: "test",
//   description: "test description",
// } as jest.Mocked<ICampaign>;

// const messageMock = {
//   from: "5511999999999",
//   isGroupMsg: false,
// } as jest.Mocked<venom.Message>;

// // class TestBot extends Bot {
// //   constructor(
// //     client: venom.Whatsapp,
// //     commands?: Record<string, Resources>
// //   ) {
// //     super(client, commands);
// //   }

// // }

// const bot = new Bot(clientMock);

// afterEach(() => {
//   jest.clearAllMocks();
// });

// describe("Bot", () => {
//   describe(Resources.LIST_CAMPAIGNS, () => {
//     it("should return text from communication service related to the resource", async () => {
//       const mockCampaignsList = [mockCampaign];
//       spyCoreApiServiceListCampaigns.mockResolvedValue(mockCampaignsList);

//       spyCommunicationServiceListCampaigns.mockReturnValue(mockCampaign.name);

//       await expect(bot[Resources.LIST_CAMPAIGNS]()).resolves.toEqual(
//         mockCampaign.name
//       );

//       expect(spyCoreApiServiceListCampaigns).toHaveBeenCalled();
//       expect(spyCommunicationServiceListCampaigns).toHaveBeenCalledWith(
//         mockCampaignsList
//       );
//     });
//   });

//   describe(Resources.GET_CAMPAIGN, () => {
//     it("should return text from communication service related to the resource", async () => {
//       spyCoreApiServiceGetCampaignDetails.mockResolvedValue(mockCampaign);

//       spyCommunicationServiceGetCampaignDetails.mockReturnValue(
//         `${mockCampaign.name} - ${mockCampaign.description}`
//       );

//       await expect(
//         bot[Resources.GET_CAMPAIGN](mockCampaign.name)
//       ).resolves.toEqual(`${mockCampaign.name} - ${mockCampaign.description}`);

//       expect(spyCoreApiServiceGetCampaignDetails).toHaveBeenCalledWith({
//         campaignName: mockCampaign.name,
//       });
//       expect(spyCommunicationServiceGetCampaignDetails).toHaveBeenCalledWith(
//         mockCampaign
//       );
//     });
//   });

//   describe(Resources.ASSIGN_TO_CAMPAIGN, () => {
//     it("should return text from communication service related to the resource", async () => {
//       spyCoreApiServiceAssignToCampaigns.mockResolvedValue();

//       spyCommunicationServiceAssignToCampaigns.mockReturnValue(
//         "successfully signed to campaign"
//       );

//       await expect(
//         bot[Resources.ASSIGN_TO_CAMPAIGN](
//           mockCampaign.name,
//           "test",
//           "10",
//           messageMock
//         )
//       ).resolves.toEqual("successfully signed to campaign");

//       expect(spyCoreApiServiceAssignToCampaigns).toHaveBeenCalledWith({
//         campaignName: mockCampaign.name,
//         userName: "test",
//         quantity: "10",
//         phoneNumber: messageMock.from,
//       });
//       expect(spyCommunicationServiceAssignToCampaigns).toHaveBeenCalled();
//     });
//   });

//   describe("handleCommand", () => {
//     it("should list active campaigns", async () => {
//       const message = Object.assign({ body: "!campaigns" }, messageMock);
//       const botPrototype = Bot.prototype as jest.Mocked<any>;

//       const spyHandleCommand = jest.spyOn(botPrototype, "handleCommand");
//       const spyRunCommand = jest.spyOn(botPrototype, "runCommand");
//       const spySendText = jest.spyOn(botPrototype, "sendText");
//       const spyValidateCommand = jest.spyOn(botPrototype, "validateCommand");

//       spyRunCommand.mockResolvedValue("successfully listed campaigns");
//       spyValidateCommand.mockResolvedValue({
//         commandName: "campaigns",
//         args: [],
//       });

//       const handleCommandImplementation =
//         spyHandleCommand.getMockImplementation() || jest.fn();

//       await expect(
//         handleCommandImplementation.call(bot, message)
//       ).resolves.toBeUndefined();

//       expect(spySendText).toHaveBeenCalledWith(
//         expect.objectContaining({
//           to: message.from,
//           text: "successfully listed campaigns",
//         })
//       );
//     });
//   });
// });
