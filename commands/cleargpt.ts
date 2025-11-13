//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";
import { clearConversation } from "../helpers/conversationHistory.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  // Get model name from args, default to "gpt"
  const model = args[0]?.toLowerCase() || "gpt";

  const validModels = ["gpt", "gemini", "llama", "ds", "evilllama"];

  if (!validModels.includes(model)) {
    await msg.reply(
      `Invalid model. Valid models: ${validModels.join(", ")}\n\nUsage: !cleargpt [model]`
    );
    return;
  }

  // Clear conversation history for the specified model
  const deletedCount = await clearConversation(chatId, model);

  if (deletedCount > 0) {
    await sendLocalized(client, msg, "cleargpt.success", {
      model: model.toUpperCase(),
    });
  } else {
    await sendLocalized(client, msg, "cleargpt.no_history", {
      model: model.toUpperCase(),
    });
  }
};

const command: Command = {
  name: "cleargpt",
  description: "cleargpt.description",
  command: "!cleargpt",
  commandType: "plugin",
  isDependent: false,
  help: "cleargpt.help",
  execute,
  public: true,
};

export default command;
