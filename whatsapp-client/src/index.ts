import * as dotenv from "dotenv";
dotenv.config();

import * as venom from "venom-bot";
import Bot from "./bot";

function listen(client: venom.Whatsapp) {
  const bot = new Bot(client);
  bot.start();
}

venom
  .create({
    disableWelcome: true,
    session: "session", //name of session
    multidevice: true, // for version not multidevice use false.(default: true)
  })
  .then(listen)
  .catch(console.error);
