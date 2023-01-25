import { Client, Message } from "whatsapp-web.js";

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!msg.hasQuotedMsg) {
    return await client.sendMessage(
      chatId,
      "Please reply to a message to delete."
    );
  }

  const quote = await msg.getQuotedMessage();

  try {
    await quote.delete(true);
    await msg.delete(true);
  } catch {
    await client.sendMessage(chatId, "Something went wrong while deleting.");
  }
};

module.exports = {
  name: "Delete",
  description: "Delete a message for everyone",
  command: "!delete",
  commandType: "plugin",
  isDependent: false,
  help: `*Delete*\n\nDelete a message for everyone.\n\nReply a message with *!delete* to delete`,
  execute,
  public: false,
};
