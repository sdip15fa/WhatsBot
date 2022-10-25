//jshint esversion:8
// Coded by Sumanjay (https://github.com/cyberboysumanjay)
import axios from "axios";
import { Client, Message } from "whatsapp-web.js";

export async function getShortURL(input: string) {
  return axios
    .get(`https://da.gd/s?url=${input}`)
    .then(async function (response) {
      let shortened = response.data;
      let out = {
        input: input,
        short: shortened.replace(/\n/g, ""),
      };
      return out;
    })
    .catch(function () {
      return "error";
    });
}
const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;
  const chatId = (await msg.getChat()).id._serialized;
  if (msg.hasQuotedMsg) {
    let quotedMsg = await msg.getQuotedMessage();
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
  public: true
};