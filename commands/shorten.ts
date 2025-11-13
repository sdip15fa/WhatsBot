import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
// Coded by Sumanjay (https://github.com/cyberboysumanjay)
import axios from "../helpers/axios.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

export async function getShortURL(input: string, customSuffix?: string) {
  const requestBody: any = {
    target: input,
  };

  if (customSuffix) {
    requestBody.customurl = customSuffix;
  }

  return axios
    .post<{
      address: string;
      banned: boolean;
      created_at: string;
      id: string;
      link: string;
      password: boolean;
      target: string;
      description: string;
      updated_at: string;
      visit_count: number;
    }>(
      `https://${process.env.KUTT_DOMAIN}/api/v2/links`,
      requestBody,
      {
        headers: {
          "X-API-KEY": process.env.KUTT_API_KEY,
        },
      },
    )
    .then(async function (res) {
      const { data } = res;
      return {
        input,
        short: data.link,
      };
    })
    .catch(function (err) {
      // console.log(err.response.data);
      return "error";
    });
}
const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;
  const chatId = (await msg.getChat()).id._serialized;
  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    // If args[0] is provided when replying, use it as custom suffix
    const customSuffix = args[0];
    data = await getShortURL(quotedMsg.body, customSuffix);
  } else {
    // args[0] is the URL, args[1] is the optional custom suffix
    const url = args[0];
    const customSuffix = args[1];
    data = await getShortURL(url, customSuffix);
  }

  if (data == "error") {
    await client.sendMessage(
      chatId,
      getString("shorten.error", await getGroupLanguage(msg)),
    );
  } else if (typeof data !== "string") {
    await client.sendMessage(chatId, data.short);
  }
};

const command: Command = {
  name: "Shorten Link",
  description: "shorten.description",
  command: "!shorten",
  commandType: "plugin",
  isDependent: false,
  help: "shorten.help",
  execute,
  public: true,
};

export default command;
