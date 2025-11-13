//jshint esversion:6

import { Client, Message, GroupChat, Contact } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message) => {
  try {
    let targetContact: Contact;

    // Check if replying to someone
    if (msg.hasQuotedMsg) {
      const quotedMsg = await msg.getQuotedMessage();
      targetContact = await quotedMsg.getContact();
    } else if (msg.mentionedIds && msg.mentionedIds.length > 0) {
      // Check if someone is mentioned
      targetContact = await client.getContactById(
        (msg.mentionedIds[0] as any)._serialized || msg.mentionedIds[0],
      );
    } else {
      // Get info about the sender
      targetContact = await msg.getContact();
    }

    const chat = await msg.getChat();
    let infoMessage = `👤 *User Information*\n\n`;
    infoMessage += `*Name:* ${targetContact.pushname || "N/A"}\n`;
    infoMessage += `*Number:* ${targetContact.number}\n`;
    infoMessage += `*ID:* \`${targetContact.id._serialized}\`\n`;
    infoMessage += `*Is Business:* ${
      targetContact.isBusiness ? "Yes" : "No"
    }\n`;
    infoMessage += `*Is Enterprise:* ${
      targetContact.isEnterprise ? "Yes" : "No"
    }\n`;
    infoMessage += `*Is My Contact:* ${
      targetContact.isMyContact ? "Yes" : "No"
    }\n`;
    infoMessage += `*Is Blocked:* ${targetContact.isBlocked ? "Yes" : "No"}\n`;

    // If in group, show group-specific info
    if (chat.isGroup) {
      const groupChat = chat as GroupChat;
      const participants = groupChat.participants || [];
      const participant = participants.find(
        (p: any) => p.id._serialized === targetContact.id._serialized,
      );

      if (participant) {
        infoMessage += `\n*Group Role:*\n`;
        if (participant.isSuperAdmin) {
          infoMessage += `👑 Group Owner\n`;
        } else if (participant.isAdmin) {
          infoMessage += `🛡️ Admin\n`;
        } else {
          infoMessage += `👤 Member\n`;
        }
      }
    }

    // Get profile picture if available
    try {
      const profilePicUrl = await targetContact.getProfilePicUrl();
      if (profilePicUrl) {
        infoMessage += `\n*Profile Picture:* Available`;
        // Note: Could download and send the picture here if needed
      }
    } catch (error) {
      // Profile picture not available or private
    }

    await msg.reply(infoMessage);
  } catch (error) {
    console.error("Error fetching user info:", error);
    await sendLocalized(client, msg, "userinfo.error");
  }
};

const command: Command = {
  name: "UserInfo",
  description: "Get information about a user",
  command: "!userinfo",
  commandType: "info",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
