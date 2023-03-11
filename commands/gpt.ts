//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { ChatGPTAPI } from "chatgpt";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(chatId, "Please provide prompt to chatgpt!");
  }

  const text = args.join(" ") || quotedMsg.body;

  if (text.length > 4000) {
    return client.sendMessage(chatId, "Prompt too long.");
  }

  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const res = await api.sendMessage(text);

  await client.sendMessage(chatId, res.text);
};

module.exports = {
  name: "chatgpt",
  description: "Ask chatgpt",
  command: "!gpt",
  commandType: "plugin",
  isDependent: false,
  help: `*Chatgpt*\n\nAsk chatgpt\n\n!chatgpt [text]`,
  execute,
  public: true,
};
