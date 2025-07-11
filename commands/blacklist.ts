//jshint esversion:8
// code generated by chatgpt, fixed by wcyat
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import db from "../db/index.js";
import {
  sendLocalized,
  getGroupLanguage,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatsCollection = db("chats").coll;
  const userLanguage = await getGroupLanguage(msg);

  switch (args[0]) {
    case "add": {
      if (!args[1] && !msg.hasQuotedMsg) {
        return await sendLocalized(
          client,
          msg,
          "blacklist.add.no_word_or_media",
        );
      }
      const quotedMsg = await msg.getQuotedMessage();
      if (quotedMsg && quotedMsg.hasMedia && quotedMsg.mediaKey) {
        const chatDoc = await chatsCollection.findOne({ chatId: msg.from });
        if (!chatDoc) {
          await chatsCollection.insertOne({
            chatId: msg.from,
            blacklist_media: [quotedMsg.mediaKey],
          });
        } else {
          await chatsCollection.updateOne(
            { chatId: msg.from },
            { $push: { blacklist_media: quotedMsg.mediaKey } },
          );
        }
        return await sendLocalized(client, msg, "blacklist.add.media_success");
      }
      args.shift();
      let word = args.join(" ").toLowerCase();
      if (!word.trim() && quotedMsg && quotedMsg.body) {
        word = quotedMsg.body.toLowerCase();
      }
      if (!word.trim()) {
        return await sendLocalized(
          client,
          msg,
          "blacklist.add.no_word_or_media",
        );
      }
      const chatDoc = await chatsCollection.findOne({ chatId: msg.from });
      if (!chatDoc) {
        await chatsCollection.insertOne({
          chatId: msg.from,
          blacklist: [word],
        });
      } else {
        await chatsCollection.updateOne(
          { chatId: msg.from },
          { $push: { blacklist: word } },
        );
      }
      await sendLocalized(client, msg, "blacklist.add.word_success", { word });
      break;
    }
    case "remove": {
      if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg && quotedMsg.mediaKey) {
          await chatsCollection.updateOne(
            { chatId: msg.from },
            { $pull: { blacklist_media: quotedMsg.mediaKey } },
          );
          return await sendLocalized(
            client,
            msg,
            "blacklist.remove.media_success",
          );
        }
      }
      if (!args[1]) {
        return await sendLocalized(
          client,
          msg,
          "blacklist.remove.no_word_or_media",
        );
      }
      args.shift();
      const word = args.join(" ").toLowerCase();
      await chatsCollection.updateOne(
        { chatId: msg.from },
        { $pull: { blacklist: word } },
      );
      await sendLocalized(client, msg, "blacklist.remove.word_success", {
        word,
      });
      break;
    }
    case "removeall": {
      await chatsCollection.updateOne(
        { chatId: msg.from },
        { $unset: { blacklist: 1, blacklist_media: 1 } },
      );
      return await sendLocalized(client, msg, "blacklist.removeall.success");
      break;
    }
    case "list": {
      const chatDoc = await chatsCollection.findOne({ chatId: msg.from });
      if (
        !chatDoc ||
        ((!chatDoc.blacklist || chatDoc.blacklist.length === 0) &&
          (!chatDoc.blacklist_media || chatDoc.blacklist_media.length === 0))
      ) {
        return await sendLocalized(client, msg, "blacklist.list.empty");
      }
      let message = "";
      if (chatDoc.blacklist && chatDoc.blacklist.length > 0) {
        const wordList = chatDoc.blacklist.join(", ");
        message += getString("blacklist.list.words", userLanguage, {
          wordList,
        });
      }
      if (chatDoc.blacklist_media && chatDoc.blacklist_media.length > 0) {
        if (message) message += "\n";
        message += getString("blacklist.list.media", userLanguage, {
          mediaCount: chatDoc.blacklist_media.length,
        });
      }
      await client.sendMessage(msg.from, message); // Send combined message
      break;
    }
    default: {
      await sendLocalized(client, msg, "blacklist.help");
      break;
    }
  }
};

const command: Command = {
  name: "blacklist.name",
  command: "!blacklist",
  description: "blacklist.description",
  commandType: "plugin",
  isDependent: false,
  help: "blacklist.help",
  execute,
  public: false,
};

export default command;
