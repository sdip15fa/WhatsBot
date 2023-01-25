//jshint esversion:8
// Coded by Sumanjay (https://github.com/cyberboysumanjay)
import axios from "axios";
import { Client, Message } from "whatsapp-web.js";

export async function getShortURL(input: string) {
  return axios
    .post<{
      references: unknown;
      link: string;
      id: string;
      long_url: string;
      archived: boolean;
      created_at: string;
      custom_bitlinks: string[];
      tags: string[];
      deeplinks: {
        guid: string;
        bitlink: string;
        app_uri_path: string;
        install_url: string;
        app_guid: string;
        os: string;
        install_type: string;
        created: string;
        modified: string;
        brand_guid: string;
      }[];
    }>(
      "https://api-ssl.bitly.com/v4/shorten",
      {
        long_url: input,
      },
      {
        headers: {
          authorization: `Bearer ${process.env.BITLY_API_KEY}`,
        },
      }
    )
    .then(async function (res) {
      const { data } = res;
      return {
        input,
        short: data.link,
      };
    })
    .catch(function (err) {
      console.log(err.response.data);
      return "error";
    });
}
const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;
  const chatId = (await msg.getChat()).id._serialized;
  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    data = await getShortURL(quotedMsg.body);
  } else {
    data = await getShortURL(args[0]);
  }

  if (data == "error") {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` +
        "```Please make sure the entered URL is in correct format.```"
    );
  } else if (typeof data !== "string") {
    await client.sendMessage(
      chatId,
      `Short URL for ${data.input} is 👇\n${data.short}`
    );
  }
};

module.exports = {
  name: "Shorten Link",
  description: "get shortend link for the given url",
  command: "!shorten",
  commandType: "plugin",
  isDependent: false,
  help: `*Shorten Link*\n\nCreates short URL for any valid URL. \n\n*!shorten [valid-url]*\n`,
  getShortURL,
  execute,
  public: true,
};
