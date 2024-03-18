import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import WolframAlphaAPI from "@wolfram-alpha/wolfram-alpha-api";
import config from "../config.js";
import nodeHtmlToImage from "node-html-to-image";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args[0]) {
    return await client.sendMessage(chatId, "Please provide an argument.");
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
            .join("\n");
          return `<h2>${pod.title}</h2>\n${subpodContent}`;
        })
        .join("\n");
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
    try {
      await msg.reply(new MessageMedia("image/png", base64));
    } catch {
      await client.sendMessage(chatId, new MessageMedia("image/png", base64));
    }
  } catch (error) {
    console.log(error);
    return await client.sendMessage(chatId, "An error occured.");
  }
};

const command: Command = {
  name: "Wolfram",
  description: "Use Wolfram",
  command: "!wf",
  commandType: "plugin",
  isDependent: false,
  help: `!wf [expression]`,
  execute,
  public: true,
};

export default command;
