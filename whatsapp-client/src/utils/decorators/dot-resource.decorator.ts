import "reflect-metadata";
import { Resources } from "../../utils/enums";
import { communicationService } from "../../services/communication.service";
import { coreApiService } from "../../services/core-api.service";
import { BotCommands } from "../../utils/interfaces";

export function BotResource(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  // if (target.prototype.isValidBot) {
  descriptor.value = async function (...args: any[]) {
    const key = propertyKey as Resources;

    const apiParams = await originalMethod.apply(this, args);

    const data = await coreApiService[key](apiParams);

    const message = communicationService[key](data as any);

    return message;
  };

  return descriptor;
  // }

  throw new Error("Method is not a valid Bot Resource");
}

export function BotCommandsHandler(target: Function) {
  if (!implementsBotCommands(target.constructor)) {
    throw new Error("Class does not implement BotCommands");
  }

  target.prototype.isValidBot = true;
}

function implementsBotCommands(arg: Object): arg is BotCommands {
  return true;
  // console.log({arg});
  // return Object.values(Object.freeze(Resources as any)).every((prop: any) =>
  //   arg.hasOwnProperty(prop)
  // );
}
