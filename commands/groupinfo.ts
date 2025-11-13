//jshint esversion:6

import { Client, Message, GroupChat } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message) => {
  const chat = await msg.getChat();

  if (!chat.isGroup) {
    await sendLocalized(client, msg, "groupinfo.group_only");
    return;
  }

  try {
    const groupChat = chat as GroupChat;
    const participants = groupChat.participants || [];
    const admins = participants.filter((p: any) => p.isAdmin || p.isSuperAdmin);

    let infoMessage = `📋 *Group Information*\n\n`;
    infoMessage += `*Name:* ${groupChat.name}\n`;
    infoMessage += `*Description:* ${
      (groupChat as any).description || "No description"
    }\n`;
    infoMessage += `*Created:* ${
      (groupChat as any).createdAt
        ? new Date((groupChat as any).createdAt * 1000).toLocaleString()
        : "Unknown"
    }\n`;
    infoMessage += `*Group ID:* \`${groupChat.id._serialized}\`\n`;
    infoMessage += `*Total Members:* ${participants.length}\n`;
    infoMessage += `*Admins:* ${admins.length}\n`;
    infoMessage += `*Restrict Messages:* ${
      (groupChat as any).groupMetadata?.restrict ? "Yes" : "No"
    }\n`;
    infoMessage += `*Restrict Metadata:* ${
      (groupChat as any).groupMetadata?.announce ? "Yes" : "No"
    }\n`;

    // List admins
    if (admins.length > 0 && admins.length <= 10) {
      infoMessage += `\n*Admin List:*\n`;
      for (const admin of admins) {
        const contact = await client.getContactById(admin.id._serialized);
        const role = (admin as any).isSuperAdmin ? "👑 Owner" : "🛡️ Admin";
        infoMessage += `${role} ${contact.pushname || contact.number}\n`;
      }
    }

    await msg.reply(infoMessage);
  } catch (error) {
    console.error("Error fetching group info:", error);
    await sendLocalized(client, msg, "groupinfo.error");
  }
};

const command: Command = {
  name: "GroupInfo",
  description: "Get detailed group information",
  command: "!groupinfo",
  commandType: "info",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
