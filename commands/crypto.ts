//jshint esversion:8
//Coded by Sumanjay (https://github.com/cyberboysumanjay)
import axios from "../helpers/axios.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

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
  const chatId = (await msg.getChat()).id._serialized;

  if (!args[0]) {
    return await sendLocalized(client, msg, "crypto.no_argument");
  }

  const data = await getPrice(args[0]); // Declare data with const after the check

  if (data == "error") {
    await sendLocalized(client, msg, "crypto.errorFetching");
  } else if (data == "unsupported") {
    await sendLocalized(client, msg, "crypto.unsupported");
  } else if (
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    "price" in data
  ) {
    const date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    await sendLocalized(client, msg, "crypto.price", {
      name: data.name,
      date: date,
      price: data.price,
    });
  }
};

const command: Command = {
  name: "crypto",
  description: "crypto.description",
  command: "!crypto",
  commandType: "plugin",
  isDependent: false,
  help: "crypto.help",
  execute,
  public: true,
};

export default command;
