//jshint esversion:8
// @ts-ignore
import axios from "axios";
import { Client, Message } from "whatsapp-web.js";
import { parse } from "node-html-parser";

async function fetchmetar() {
  try {
    const { data } = await axios.get(
      "https://www.hko.gov.hk/aviat/metar_eng_revamp.json"
    );
    const parsed = parse(data.metar_decode_eng_json.content.table.content);
    return parsed.querySelector("p").innerText;
  } catch {
    return null;
  }
}

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  const data = await fetchmetar();
  if (!data) {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch METAR```"
    );
  } else {
    await client.sendMessage(chatId, data);
  }
};

module.exports = {
  name: "METAR",
  description: "Gets METAR info",
  command: "!metar",
  commandType: "plugin",
  isDependent: false,
  help: `*METAR*\n\nMETAR broadcast.\n\n*!metar*\nTo get METAR info.`,
  execute,
  public: true,
};
