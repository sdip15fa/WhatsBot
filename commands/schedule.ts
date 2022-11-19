//jshint esversion:8
import { randomBytes } from "crypto";
import { Client, Message } from "whatsapp-web.js";
import { agenda } from "../helpers/agenda";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (!msg.hasQuotedMsg) {
    return await msg.reply("Please quote a message to schedule!");
  }
  const chatId = /^[\d|-]+@(g|c)\.us$/.test(args[0])
    ? args.shift()
    : (await msg.getChat()).id._serialized;
  const date = args.join(" ");
  await client.getChatById(chatId).catch(async () => {
    return await msg.reply("Chat not found");
  });
  const quoted = await msg.getQuotedMessage();
  const id = randomBytes(10).toString("hex");
  const media = await quoted.downloadMedia().catch(() => null);
  await agenda
    .schedule(date, "send message", {
      id,
      chatId,
      body: quoted.body,
      sticker: quoted.type === "sticker",
      ...(quoted.hasMedia && media && { media }),
    })
    .then(async () => {
      await msg.reply(`Scheduled for *_${date}_* with id \`\`\`${id}\`\`\`.`);
    })
    .catch(async () => {
      await msg.reply("An error occurred.");
    });
};

module.exports = {
  name: "Schedule message",
  description: "Schedule a message to be sent at a specific time",
  command: "!schedule",
  commandType: "plugin",
  isDependent: false,
  help: `*Schedule a message to be sent at a specific time.*\n\nReply to the message you want to schedule.\n\n*!schedule [chat id] [time]*\n\nIf the chat id is invalid / omitted the current chat would be used.\n\nTime example: \`\`\`in 1 minute\`\`\`\n\nFor list of chats and chat ids, use !chatlist.`,
  execute,
  public: false,
};
