//jshint esversion:8
//Coded by Sumanjay (https://github.com/cyberboysumanjay)
import axios from "axios";
import { Client, Message } from "whatsapp-web.js";

async function getPrice(cryptoCode: string) {
  cryptoCode = cryptoCode.toUpperCase();
  return axios
    .get("https://public.coindcx.com/market_data/current_prices")
    .then(async function (response) {
      const data = response.data;
      const cryptoCodeINR = cryptoCode + "INR";
      if (data[cryptoCode] != undefined || data[cryptoCodeINR] != undefined) {
        cryptoCode = data[cryptoCode] == undefined ? cryptoCodeINR : cryptoCode;
        const out = {
          name: cryptoCode,
          price: data[cryptoCode],
        };
        return out;
      } else {
        return "unsupported";
      }
    })
    .catch(function () {
      return "error";
    });
}
const execute = async (client: Client, msg: Message, args: string[]) => {
  const data = await getPrice(args[0]);
  const chatId = (await msg.getChat()).id._serialized;
  if (data == "error") {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` +
        "```Something unexpected happened while fetching Cryptocurrency Price```"
    );
  }
  if (data == "unsupported") {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` +
        "```Support for this CryptoCurrency is not yet added```"
    );
  } else if (data instanceof Object) {
    const date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    await client.sendMessage(
      chatId,
      `Price of *${data.name}* as of ${date} is *₹ ${data.price}*`
    );
  }
};

module.exports = {
  name: "Crypto Currency",
  description: "Gets price info for requested crypto currency",
  command: "!crypto",
  commandType: "plugin",
  isDependent: false,
  help: `*Crypto Currency*\n\nGet current price of cryptocurrency. \n\n*!crypto [crypto-code]*\n`,
  execute,
  public: true,
};
