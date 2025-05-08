import { Client, Message, GroupChat } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import {
  setGroupLanguage,
  clearGroupLanguage,
  getGroupLanguage,
} from "../helpers/groupLangSettingsDB.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";
// import config from "../config.js"; // For default bot language, if needed later

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();
  // const chatId = chat.id._serialized; // Not needed directly if sendLocalized handles it

  // const sender = groupChat.participants.find( // Unused variable
  //   (p) => p.id._serialized === msg.author,
  // );

  // In whatsapp-web.js, msg.author is the id of the sender of the message, if it's from a group.
  // If the message is not from a group, msg.author will be undefined.
  // For group messages, msg.from is the group chat id, and msg.author is the user who sent it.
  const authorId = msg.author;
  if (!authorId) {
    // Should not happen if chat.isGroup is true, but as a safeguard
    await sendLocalized(client, msg, "GENERAL_ERROR");
    return;
  }

  const action = args[0]?.toLowerCase();

  if (action === "clear") {
    await clearGroupLanguage(chat.id._serialized);
    await sendLocalized(client, msg, "SETLANG_CLEARED");
  } else if (action === "yue" || action === "en" || action === "ja") {
    const langToSet = action as "yue" | "en" | "ja";
    await setGroupLanguage(chat.id._serialized, langToSet);
    let langName = "";
    if (langToSet === "yue") {
      langName = "Cantonese (yue)";
    } else if (langToSet === "en") {
      langName = "English (en)";
    } else {
      langName = "Japanese (ja)";
    }
    await sendLocalized(client, msg, "SETLANG_SUCCESS", { language: langName });
  } else if (action === "status") {
    const currentLang = await getGroupLanguage(chat.id._serialized);
    if (currentLang) {
      let langName = "";
      if (currentLang === "yue") {
        langName = "Cantonese (yue)";
      } else if (currentLang === "en") {
        langName = "English (en)";
      } else {
        langName = "Japanese (ja)";
      }
      await sendLocalized(client, msg, "SETLANG_STATUS_SET", {
        language: langName,
      });
    } else {
      await sendLocalized(client, msg, "SETLANG_STATUS_NOT_SET");
    }
  } else {
    await sendLocalized(client, msg, "SETLANG_USAGE");
  }
};

const command: Command = {
  name: "Set Group Language",
  command: "!setlang",
  description:
    "Sets the preferred language for bot responses in this group (Cantonese, English, or Japanese).",
  commandType: "admin", // Or 'plugin' if 'admin' isn't a defined type, adjust as needed
  isDependent: false,
  help: `*Set Group Language*\n\nSets the preferred language for bot responses in this group.\n\n_Usage:_\n!setlang yue - Set to Cantonese\n!setlang en - Set to English\n!setlang ja - Set to Japanese\n!setlang clear - Clear preference (use default bot language)\n!setlang status - Show current group language setting\n\n*Only group admins can use this command.*`,
  execute,
  public: true, // This command is public, but execution logic checks for admin
};

export default command;
