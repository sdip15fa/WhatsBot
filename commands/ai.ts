//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";
import config from "../config.js";
import db from "../db/index.js";
import {
  clearConversation,
  exportConversation,
  getConversationStats,
  getConversationHistory,
  addMessageToHistory,
} from "../helpers/conversationHistory.js";
import { GoogleGenAI } from "@google/genai";
import axios from "../helpers/axios.js";

const { MessageMedia } = whatsapp;

// Helper to get/set default model for a chat
async function getDefaultModel(chatId: string): Promise<string> {
  try {
    const settings = await db("ai_settings").coll.findOne({ chatId });
    return settings?.defaultModel || "gemini"; // Default to gemini
  } catch (error) {
    return "gemini";
  }
}

async function setDefaultModel(chatId: string, model: string): Promise<void> {
  try {
    await db("ai_settings").coll.updateOne(
      { chatId },
      { $set: { defaultModel: model, updatedAt: Date.now() } },
      { upsert: true },
    );
  } catch (error) {
    console.error("Error setting default model:", error);
  }
}

// Model executor functions
async function executeGemini(
  client: Client,
  msg: Message,
  prompt: string,
  chatId: string,
  hasMedia: boolean,
  mediaMsg?: Message,
): Promise<string> {
  if (!config.gemini_api_key) {
    await sendLocalized(client, msg, "gemini.not_available");
    return "";
  }

  let imageData = null;
  if (hasMedia && mediaMsg) {
    const attachmentData = await mediaMsg.downloadMedia().catch(() => null);
    if (attachmentData && attachmentData.mimetype.startsWith("image/")) {
      imageData = {
        inlineData: {
          data: attachmentData.data,
          mimeType: attachmentData.mimetype,
        },
      };
    }
  }

  const conversationHistory = await getConversationHistory(chatId, "gemini");
  const history: { role: "model" | "user"; parts: { text: string }[] }[] = [];

  if (conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "user" : "model";
      history.push({
        role,
        parts: [{ text: msg.content }],
      });
    });
  }

  const genAI = new GoogleGenAI({ apiKey: config.gemini_api_key });
  const contentParts = [];
  if (imageData) contentParts.push(imageData);
  contentParts.push(prompt);

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: contentParts,
    ...(history.length > 0 && { history }),
  });

  const textResponse = response.text;

  await addMessageToHistory(chatId, "gemini", {
    role: "user",
    content: prompt,
    timestamp: Date.now(),
    ...(imageData && { imageData }),
  });

  await addMessageToHistory(chatId, "gemini", {
    role: "model",
    content: textResponse,
    timestamp: Date.now(),
  });

  return textResponse;
}

async function executeGPT(
  client: Client,
  msg: Message,
  prompt: string,
  chatId: string,
  hasMedia: boolean,
  mediaMsg?: Message,
): Promise<string> {
  if (!config.cf_worker.url) {
    await sendLocalized(client, msg, "gpt.no_cf_worker_url");
    return "";
  }

  let imageBase64 = null;
  let imageData = null;
  if (hasMedia && mediaMsg) {
    const attachmentData = await mediaMsg.downloadMedia().catch(() => null);
    if (attachmentData && attachmentData.mimetype.startsWith("image/")) {
      imageBase64 = attachmentData.data;
      imageData = {
        inlineData: {
          data: attachmentData.data,
          mimeType: attachmentData.mimetype,
        },
      };
    }
  }

  const conversationHistory = await getConversationHistory(chatId, "gpt");
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "user" : "assistant";
      messages.push({ role, content: msg.content });
    });
  }

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;
  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );
  const authHeader = `Basic ${encodedCredentials}`;

  const requestParams: any = {
    ...(!messages?.length && !imageBase64 && { prompt }),
    ...(messages?.length && {
      messages: encodeURIComponent(JSON.stringify(messages)),
    }),
    ...(imageBase64 && { image: imageBase64, prompt }),
  };

  const response = await axios.get<{ response: string }>(
    `${config.cf_worker.url}gpt`,
    { params: requestParams, headers: { Authorization: authHeader } },
  );

  await addMessageToHistory(chatId, "gpt", {
    role: "user",
    content: prompt,
    timestamp: Date.now(),
    ...(imageData && { imageData }),
  });

  await addMessageToHistory(chatId, "gpt", {
    role: "assistant",
    content: response.data.response,
    timestamp: Date.now(),
  });

  return response.data.response;
}

async function executeLlama(
  client: Client,
  msg: Message,
  prompt: string,
  chatId: string,
): Promise<string> {
  if (!config.cf_worker.url) {
    await sendLocalized(client, msg, "llama.no_cf_worker_url");
    return "";
  }

  const conversationHistory = await getConversationHistory(chatId, "llama");
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "user" : "assistant";
      messages.push({ role, content: msg.content });
    });
  }

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;
  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );
  const authHeader = `Basic ${encodedCredentials}`;

  const response = await axios.get<{ response: string }>(config.cf_worker.url, {
    params: {
      ...(!messages?.length && { prompt }),
      ...(messages?.length && {
        messages: encodeURIComponent(JSON.stringify(messages)),
      }),
    },
    headers: { Authorization: authHeader },
  });

  await addMessageToHistory(chatId, "llama", {
    role: "user",
    content: prompt,
    timestamp: Date.now(),
  });

  await addMessageToHistory(chatId, "llama", {
    role: "assistant",
    content: response.data.response,
    timestamp: Date.now(),
  });

  return response.data.response;
}

async function executeDeepSeek(
  client: Client,
  msg: Message,
  prompt: string,
  chatId: string,
): Promise<string> {
  if (!config.cf_worker.url) {
    await sendLocalized(client, msg, "ds.no_cf_worker_url");
    return "";
  }

  const conversationHistory = await getConversationHistory(chatId, "ds");
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "user" : "assistant";
      messages.push({ role, content: msg.content });
    });
  }

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;
  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );
  const authHeader = `Basic ${encodedCredentials}`;

  const response = await axios.get<{ response: string }>(
    `${config.cf_worker.url}ds`,
    {
      params: {
        ...(!messages?.length && { prompt }),
        ...(messages?.length && {
          messages: encodeURIComponent(JSON.stringify(messages)),
        }),
      },
      headers: { Authorization: authHeader },
    },
  );

  await addMessageToHistory(chatId, "ds", {
    role: "user",
    content: prompt,
    timestamp: Date.now(),
  });

  await addMessageToHistory(chatId, "ds", {
    role: "assistant",
    content: response.data.response,
    timestamp: Date.now(),
  });

  return response.data.response;
}

async function executeEvilLlama(
  client: Client,
  msg: Message,
  prompt: string,
  chatId: string,
): Promise<string> {
  if (!config.cf_worker.url) {
    await sendLocalized(client, msg, "evilllama.no_cf_worker_url");
    return "";
  }

  const conversationHistory = await getConversationHistory(chatId, "evilllama");
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "user" : "assistant";
      messages.push({ role, content: msg.content });
    });
  }

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;
  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );
  const authHeader = `Basic ${encodedCredentials}`;

  const response = await axios.get<{ response: string }>(config.cf_worker.url, {
    params: {
      ...(!messages?.length && { prompt }),
      ...(messages?.length && {
        messages: encodeURIComponent(JSON.stringify(messages)),
      }),
      evil: true,
    },
    headers: { Authorization: authHeader },
  });

  await addMessageToHistory(chatId, "evilllama", {
    role: "user",
    content: prompt,
    timestamp: Date.now(),
  });

  await addMessageToHistory(chatId, "evilllama", {
    role: "assistant",
    content: response.data.response,
    timestamp: Date.now(),
  });

  return response.data.response;
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (args.length === 0) {
    await sendLocalized(client, msg, "ai.no_argument");
    return;
  }

  const firstArg = args[0].toLowerCase();

  // Management commands
  if (firstArg === "clear") {
    const model = args[1]?.toLowerCase();
    const validModels = ["gpt", "gemini", "llama", "ds", "evilllama", "all"];

    if (model && !validModels.includes(model)) {
      await msg.reply(
        `Invalid model. Valid models: ${validModels.join(
          ", ",
        )}\n\nUsage: !ai clear [model|all]`,
      );
      return;
    }

    if (!model || model === "all") {
      const deletedCount = await clearConversation(chatId);
      await msg.reply(
        `✅ Cleared all AI conversation history (${deletedCount} ${
          deletedCount === 1 ? "conversation" : "conversations"
        })`,
      );
    } else {
      const deletedCount = await clearConversation(chatId, model);
      if (deletedCount > 0) {
        await msg.reply(
          `✅ Cleared ${model.toUpperCase()} conversation history`,
        );
      } else {
        await msg.reply(
          `No ${model.toUpperCase()} conversation history found.`,
        );
      }
    }
    return;
  }

  if (firstArg === "history") {
    const model = args[1]?.toLowerCase() || (await getDefaultModel(chatId));
    const validModels = ["gpt", "gemini", "llama", "ds", "evilllama"];

    if (!validModels.includes(model)) {
      await msg.reply(
        `Invalid model. Valid models: ${validModels.join(
          ", ",
        )}\n\nUsage: !ai history [model]`,
      );
      return;
    }

    const history = await getConversationHistory(chatId, model);

    if (history.length === 0) {
      await msg.reply(
        `No conversation history found for ${model.toUpperCase()}.`,
      );
      return;
    }

    let historyText = `📜 *${model.toUpperCase()} Conversation History*\n`;
    historyText += `Total messages: ${history.length}\n\n`;

    const recentHistory = history.slice(-10);
    recentHistory.forEach((msg) => {
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

  if (firstArg === "export") {
    const model = args[1]?.toLowerCase() || (await getDefaultModel(chatId));
    const validModels = ["gpt", "gemini", "llama", "ds", "evilllama"];

    if (!validModels.includes(model)) {
      await msg.reply(
        `Invalid model. Valid models: ${validModels.join(
          ", ",
        )}\n\nUsage: !ai export [model]`,
      );
      return;
    }

    const exportText = await exportConversation(chatId, model);
    await msg.reply(exportText);
    return;
  }

  if (firstArg === "stats") {
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

  if (firstArg === "models") {
    const defaultModel = await getDefaultModel(chatId);
    let modelsText = `🤖 *Available AI Models*\n\n`;
    modelsText += `Current default: *${defaultModel.toUpperCase()}*\n\n`;

    modelsText += `1. *Gemini* (Gemini 2.0 Flash) ${
      defaultModel === "gemini" ? "⭐" : ""
    }\n`;
    modelsText += `   Features: Text, Vision, Fast\n\n`;

    modelsText += `2. *GPT* (GPT-4O-mini 120B) ${
      defaultModel === "gpt" ? "⭐" : ""
    }\n`;
    modelsText += `   Features: Text, Vision\n\n`;

    modelsText += `3. *Llama* (Llama 3.3 70B) ${
      defaultModel === "llama" ? "⭐" : ""
    }\n`;
    modelsText += `   Features: Text chat\n\n`;

    modelsText += `4. *DeepSeek* (DeepSeek R1) ${
      defaultModel === "ds" ? "⭐" : ""
    }\n`;
    modelsText += `   Features: Reasoning, CoT\n\n`;

    modelsText += `5. *EvilLlama* (Uncensored) ${
      defaultModel === "evilllama" ? "⭐" : ""
    }\n`;
    modelsText += `   Features: No filters\n\n`;

    modelsText += `*Usage:*\n`;
    modelsText += `!ai [prompt] - Use default model\n`;
    modelsText += `!ai gemini [prompt] - Use specific model\n`;
    modelsText += `!ai use gemini - Set default model`;

    await msg.reply(modelsText);
    return;
  }

  if (firstArg === "use") {
    const model = args[1]?.toLowerCase();
    const validModels = ["gpt", "gemini", "llama", "ds", "evilllama"];

    if (!model || !validModels.includes(model)) {
      await msg.reply(
        `Invalid model. Valid models: ${validModels.join(
          ", ",
        )}\n\nUsage: !ai use [model]`,
      );
      return;
    }

    await setDefaultModel(chatId, model);
    await msg.reply(`✅ Default AI model set to *${model.toUpperCase()}*`);
    return;
  }

  if (firstArg === "help") {
    await sendLocalized(client, msg, "ai.help");
    return;
  }

  // AI prompt execution
  const validModels = ["gpt", "gemini", "llama", "ds", "evilllama"];
  let selectedModel = await getDefaultModel(chatId);
  let prompt = args.join(" ");

  // Check if first arg is a model name
  if (validModels.includes(firstArg)) {
    selectedModel = firstArg;
    prompt = args.slice(1).join(" ");

    if (!prompt) {
      await msg.reply(
        `Please provide a prompt for ${selectedModel.toUpperCase()}`,
      );
      return;
    }
  }

  // Handle media
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());
  const hasMedia = msg.hasMedia || (quotedMsg && quotedMsg.hasMedia);
  const mediaMsg = msg.hasMedia ? msg : quotedMsg;

  // Add context from quoted message
  if (quotedMsg?.body && !hasMedia) {
    prompt = `Context from quoted message: ${quotedMsg.body}\n\n${prompt}`;
  }

  try {
    let response: string;

    // Route to appropriate model
    switch (selectedModel) {
      case "gemini":
        response = await executeGemini(
          client,
          msg,
          prompt,
          chatId,
          hasMedia,
          mediaMsg,
        );
        break;
      case "gpt":
        response = await executeGPT(
          client,
          msg,
          prompt,
          chatId,
          hasMedia,
          mediaMsg,
        );
        break;
      case "llama":
        response = await executeLlama(client, msg, prompt, chatId);
        break;
      case "ds":
        response = await executeDeepSeek(client, msg, prompt, chatId);
        break;
      case "evilllama":
        response = await executeEvilLlama(client, msg, prompt, chatId);
        break;
      default:
        response = await executeGemini(
          client,
          msg,
          prompt,
          chatId,
          hasMedia,
          mediaMsg,
        );
    }

    // Send response
    await msg.reply(`${selectedModel.toUpperCase()}: ${response}`);
  } catch (error) {
    console.error(`${selectedModel} generation failed:`, error);
    await msg.reply(
      `❌ ${selectedModel.toUpperCase()} generation failed. Please try again.`,
    );
  }
};

const command: Command = {
  name: "AI",
  description: "ai.description",
  command: "!ai",
  commandType: "plugin",
  isDependent: false,
  help: "ai.help",
  execute,
  public: true,
};

export default command;
