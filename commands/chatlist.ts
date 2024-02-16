//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

const execute = async (client: Client, _msg: Message, args: string[]) => {
  const page = Number(args[0]) || 1;
  const chats = (await client.getChats()).filter(
    (_v, index) => index < page * 20 && index >= (page - 1) * 20,
  );
  await client.sendMessage(
    process.env.WTS_OWNER_ID,
    `Chats:
${chats
  .map(
    (chat, index) =>
      `${index + 1}. ${chat.name} \`\`\`${chat.id._serialized}\`\`\``,
  )
  .join("\n")}`,
  );
};

const command: Command = {
  name: "Chat list",
  description: "Get a list of chats",
  command: "!chatlist",
  commandType: "plugin",
  isDependent: false,
  help: `*Get a list of chats.* \n\n*!chatlist [page]*\n\nTwenty chats are shown in a page.`,
  execute,
  public: false,
};

export default command;
