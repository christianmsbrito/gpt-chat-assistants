import * as dotenv from "dotenv";
dotenv.config();

import * as venom from "venom-bot";
import Bot from "./bot";
import { CoreApiService } from "./services/core-api.service";

const coreApiService = new CoreApiService(
  process.env.CORE_API_URL || "",
  process.env.BOT_API_KEY || ""
);

function listen(client: venom.Whatsapp) {
  const bot = new Bot(client, coreApiService);
  bot.start();
}

const qrCallback = (qrCode: string) => {
  // todo: logic for displaying the qr code in the admin portal
  console.log('QR Code is generated!');
};

const statusFind = (statusSession: string, session: string) => {
  console.log(statusSession);
};

venom
  .create("session", qrCallback, statusFind, {
    headless: 'old', // Headless chrome
    devtools: false, // Open devtools by default
    // useChrome: false, // If false will use Chromium instance
    debug: true, // Opens a debug session
    logQR: true, // Logs QR automatically in terminal
    // refreshQR: 15000, // Will refresh QR every 15 seconds, 0 will load QR once. Default is 30 seconds
    browserPathExecutable: '/usr/bin/google-chrome', // =======> this allow working on WSL2 - needs Chrome to be installed on Linux side
    // addBrowserArgs: ['--user-agent=Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36'], // Parameters to be added into the chrome browser instance
  })
  .then(listen)
  .catch(err => console.error(JSON.stringify(err)));
