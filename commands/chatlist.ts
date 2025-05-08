//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { getString } from "../helpers/i18n.js";
import {
  sendLocalized,
  getGroupLanguage,
} from "../helpers/localizedMessenger.js"; // Assuming owner chat is treated as a group for language

const execute = async (client: Client, msg: Message, args: string[]) => {
  const page = Number(args[0]) || 1;
  const chats = (await client.getChats()).filter(
    (_v, index) => index < page * 20 && index >= (page - 1) * 20,
  );

  const ownerLanguage = await getGroupLanguage(msg); // Get owner's language

  const chatListMessage = getString("chatlist.list", ownerLanguage, {
    chatList: chats
      .map(
        (chat, index) =>
          `${index + 1}. ${chat.name} \`\`\`${chat.id._serialized}\`\`\``,
      )
      .join("\n"),
  });

  await sendLocalized(client, msg, "chatlist.list", {
    chatList: chats
      .map(
        (chat, index) =>
          `${index + 1}. ${chat.name} \`\`\`${chat.id._serialized}\`\`\``,
      )
      .join("\n"),
  });
};

const command: Command = {
  name: "chatlist.name",
  description: "chatlist.description",
  command: "!chatlist",
  commandType: "plugin",
  isDependent: false,
  help: "chatlist.help",
  execute,
  public: false,
};

export default command;
