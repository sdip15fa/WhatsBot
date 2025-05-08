import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import WolframAlphaAPI from "@wolfram-alpha/wolfram-alpha-api";
import config from "../config.js";
import nodeHtmlToImage from "node-html-to-image";
import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js"; // Added getGroupLanguage
import { getString } from "../helpers/i18n.js"; // Added getString
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args[0]) {
    return await sendLocalized(client, msg, "wf.no_argument");
  }

  try {
    const waApi = WolframAlphaAPI(config.wolfram_app_id);
    const output = await waApi.getFull(args.join(" ")).then((queryresult) => {
      const pods = queryresult.pods;
      const output = pods
        .map((pod) => {
          const subpodContent = pod.subpods
            .map(
              (subpod) =>
                `  <img src="${subpod.img.src}" alt="${subpod.img.alt}">`,
            )
            .join("\\n");
          return `<h2>${pod.title}</h2>\\n${subpodContent}`;
        })
        .join("\\n");
      return output;
    });
    const html = `<html>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css" rel="stylesheet">
      </head>
      <body>
        <div style="padding: 20px">
          ${output}
        </div>
      <body>
    <html>`;
    const image = await nodeHtmlToImage({
      html,
      puppeteerArgs: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--headless",
          "--disable-gpu",
          "--disable-dev-shm-usage",
        ],
      },
    });
    const base64 = Buffer.from(image as string, "binary").toString("base64");
    const media = new MessageMedia("image/png", base64, "wolfram_alpha.png");
    const caption = getString("wf.success", await getGroupLanguage(msg)); // Get the localized caption

    try {
      await client.sendMessage(chatId, media, { caption: caption });
    } catch (sendError) {
      console.error("Failed to send Wolfram Alpha image:", sendError);
      // Attempt to send again or notify user of send failure
      try {
        await client.sendMessage(chatId, media, { caption: caption });
      } catch (retrySendError) {
        console.error(
          "Failed to send Wolfram Alpha image on retry:",
          retrySendError,
        );
        await sendLocalized(client, msg, "wf.send_error"); // Notify user of send failure
      }
    }
  } catch (error) {
    console.log(error);
    return await sendLocalized(client, msg, "wf.error");
  }
};

const command: Command = {
  name: "Wolfram",
  description: "Use Wolfram",
  command: "!wf",
  commandType: "plugin",
  isDependent: false,
  help: "wf.help",
  execute,
  public: true,
};

export default command;
