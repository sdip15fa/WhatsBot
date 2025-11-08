//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";
import {
  getAllConversations,
  clearConversation,
  exportConversation,
  getConversationStats,
  getConversationHistory,
} from "../helpers/conversationHistory.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (args.length === 0) {
    await sendLocalized(client, msg, "ai.no_argument");
    return;
  }

  const subCommand = args[0].toLowerCase();

  // !ai clear [model] - Clear conversation history
  if (subCommand === "clear") {
    const model = args[1]?.toLowerCase();

    const validModels = ["gpt", "gemini", "llama", "ds", "evilllama", "all"];

    if (model && !validModels.includes(model)) {
      await msg.reply(
        `Invalid model. Valid models: ${validModels.join(", ")}\n\nUsage: !ai clear [model|all]`
      );
      return;
    }

    if (!model || model === "all") {
      const deletedCount = await clearConversation(chatId);
      await msg.reply(
        `✅ Cleared all AI conversation history (${deletedCount} ${deletedCount === 1 ? "conversation" : "conversations"})`
      );
    } else {
      const deletedCount = await clearConversation(chatId, model);
      if (deletedCount > 0) {
        await msg.reply(
          `✅ Cleared ${model.toUpperCase()} conversation history`
        );
      } else {
        await msg.reply(`No ${model.toUpperCase()} conversation history found.`);
      }
    }
    return;
  }

  // !ai history [model] - View conversation history
  if (subCommand === "history") {
    const model = args[1]?.toLowerCase() || "gpt";

    const validModels = ["gpt", "gemini", "llama", "ds", "evilllama"];

    if (!validModels.includes(model)) {
      await msg.reply(
        `Invalid model. Valid models: ${validModels.join(", ")}\n\nUsage: !ai history [model]`
      );
      return;
    }

    const history = await getConversationHistory(chatId, model);

    if (history.length === 0) {
      await msg.reply(`No conversation history found for ${model.toUpperCase()}.`);
      return;
    }

    let historyText = `📜 *${model.toUpperCase()} Conversation History*\n`;
    historyText += `Total messages: ${history.length}\n\n`;

    // Show last 10 messages
    const recentHistory = history.slice(-10);
    recentHistory.forEach((msg, index) => {
      const role = msg.role === "user" ? "You" : model.toUpperCase();
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const content =
        msg.content.length > 100
          ? msg.content.substring(0, 100) + "..."
          : msg.content;
      historyText += `[${time}] *${role}:*\n${content}\n\n`;
    });

    if (history.length > 10) {
      historyText += `\n_Showing last 10 of ${history.length} messages. Use !ai export ${model} to get full history._`;
    }

    await msg.reply(historyText);
    return;
  }

  // !ai export [model] - Export conversation as text
  if (subCommand === "export") {
    const model = args[1]?.toLowerCase() || "gpt";

    const validModels = ["gpt", "gemini", "llama", "ds", "evilllama"];

    if (!validModels.includes(model)) {
      await msg.reply(
        `Invalid model. Valid models: ${validModels.join(", ")}\n\nUsage: !ai export [model]`
      );
      return;
    }

    const exportText = await exportConversation(chatId, model);
    await msg.reply(exportText);
    return;
  }

  // !ai stats - Show conversation statistics
  if (subCommand === "stats") {
    const stats = await getConversationStats(chatId);

    if (stats.totalModels === 0) {
      await msg.reply("No AI conversation history found.");
      return;
    }

    let statsText = `📊 *AI Conversation Statistics*\n\n`;
    statsText += `Total conversations: ${stats.totalModels}\n`;
    statsText += `Total messages: ${stats.totalMessages}\n\n`;
    statsText += `*Per Model:*\n`;

    stats.models.forEach((model) => {
      const lastUsed = new Date(model.lastUsed).toLocaleString();
      statsText += `\n${model.model.toUpperCase()}:\n`;
      statsText += `  Messages: ${model.messageCount}\n`;
      statsText += `  Last used: ${lastUsed}\n`;
    });

    await msg.reply(statsText);
    return;
  }

  // !ai models - List available AI models
  if (subCommand === "models") {
    let modelsText = `🤖 *Available AI Models*\n\n`;
    modelsText += `1. *GPT* (GPT-4O-mini 120B)\n`;
    modelsText += `   Command: !gpt [prompt]\n`;
    modelsText += `   Features: Text chat, Vision support\n\n`;

    modelsText += `2. *Gemini* (Gemini 2.0 Flash)\n`;
    modelsText += `   Command: !gemini [prompt]\n`;
    modelsText += `   Features: Text chat, Vision support\n\n`;

    modelsText += `3. *Llama* (Llama 3.3 70B)\n`;
    modelsText += `   Command: !llama [prompt]\n`;
    modelsText += `   Features: Text chat\n\n`;

    modelsText += `4. *DeepSeek* (DeepSeek R1)\n`;
    modelsText += `   Command: !ds [prompt]\n`;
    modelsText += `   Features: Reasoning, Chain-of-thought\n\n`;

    modelsText += `5. *EvilLlama* (Llama Uncensored)\n`;
    modelsText += `   Command: !evilllama [prompt]\n`;
    modelsText += `   Features: Text chat, No safety filters\n\n`;

    modelsText += `All models support persistent conversation history!\n`;
    modelsText += `Use !ai history [model] to view past conversations.`;

    await msg.reply(modelsText);
    return;
  }

  // !ai help - Show help
  if (subCommand === "help") {
    await sendLocalized(client, msg, "ai.help");
    return;
  }

  await sendLocalized(client, msg, "ai.invalid_command");
};

const command: Command = {
  name: "AI Context Manager",
  description: "ai.description",
  command: "!ai",
  commandType: "plugin",
  isDependent: false,
  help: "ai.help",
  execute,
  public: true,
};

export default command;
