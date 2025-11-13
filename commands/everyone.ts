//jshint esversion:6

import { Client, Message, GroupChat } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();

  if (!chat.isGroup) {
    await sendLocalized(client, msg, "everyone.group_only");
    return;
  }

  try {
    const groupChat = chat as GroupChat;
    const participants = groupChat.participants || [];
    const message = args.join(" ") || "Hey everyone!";

    // Create mention list
    const mentions: string[] = [];
    let mentionText = `${message}\n\n`;

    for (const participant of participants) {
      mentions.push(participant.id._serialized);
      mentionText += `@${participant.id.user} `;
    }

    await chat.sendMessage(mentionText, {
      mentions,
    });
  } catch (error) {
    console.error("Error tagging everyone:", error);
    await sendLocalized(client, msg, "everyone.error");
  }
};

const command: Command = {
  name: "Everyone",
  description: "Tag all members in a group",
  command: "!everyone",
  commandType: "admin",
  isDependent: false,
  help: undefined,
  execute,
  public: false,
};

export default command;
