//jshint esversion:8
import { ChatGPTAPI } from "chatgpt";
import { Client, Message } from "whatsapp-web.js";
import db from "../db/index.js";

const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY,
});

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(chatId, "Please provide prompt to chatgpt!");
  }

  const text = args.join(" ") || quotedMsg.body;
  const parentMessageId = (await db("gpt").coll.findOne({ id: chatId }))
    ?.parentMessageId;

  if (text.length > 4000) {
    return client.sendMessage(chatId, "Prompt too long.");
  }

  const res = await api.sendMessage(text, { parentMessageId });

  await client.sendMessage(chatId, res.text);

  if (!parentMessageId) {
    await db("gpt").coll.insertOne({ id: chatId, parentMessageId: res.id });
  } else {
    await db("gpt").coll.updateOne(
      { id: chatId },
      { $set: { parentMessageId: res.id } }
    );
  }
};

export default {
  name: "chatgpt",
  description: "Ask chatgpt",
  command: "!gpt",
  commandType: "plugin",
  isDependent: false,
  help: `*Chatgpt*\n\nAsk chatgpt\n\n!gpt [text]`,
  execute,
  public: true,
};
