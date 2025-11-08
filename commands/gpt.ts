import { sendLocalized } from "../helpers/localizedMessenger.js";
// Import necessary modules and dependencies
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import axios from "../helpers/axios.js";
import {
  getConversationHistory,
  addMessageToHistory,
} from "../helpers/conversationHistory.js";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.cf_worker.url) {
    return sendLocalized(client, msg, "gpt.no_cf_worker_url");
  }

  // Extract the text from the user's message and check for media
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());
  const hasMedia = msg.hasMedia || (quotedMsg && quotedMsg.hasMedia);

  if (!args.length && !quotedMsg?.body && !hasMedia) {
    return sendLocalized(client, msg, "gpt.no_prompt");
  }

  let contextText = "";
  if (quotedMsg?.body) {
    contextText = `Context from quoted message: ${quotedMsg.body}\n\n`;
  }

  const userPrompt = args.join(" ");
  const text =
    contextText +
    (userPrompt || (hasMedia ? "What do you see in this image?" : ""));

  // Handle image input for vision support
  let imageData = null;
  let imageBase64 = null;
  if (hasMedia) {
    const mediaMsg = msg.hasMedia ? msg : quotedMsg;
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

  // Get conversation history from MongoDB
  const conversationHistory = await getConversationHistory(chatId, "gpt");

  const messages: { role: "system" | "user" | "assistant"; content: string | any }[] =
    [];

  // Use persistent history if available
  if (conversationHistory.length > 0) {
    conversationHistory.forEach((msg) => {
      const role = msg.role === "user" ? "user" : "assistant";
      messages.push({
        role,
        content: msg.content,
      });
    });
  }
  // Fallback to old quote-based history for backward compatibility
  else if (
    args.length &&
    msg.hasQuotedMsg &&
    quotedMsg.fromMe &&
    quotedMsg.body.startsWith("GPT:")
  ) {
    let currMsg: Message | null = msg;
    while (currMsg?.body) {
      const role =
        currMsg.body.startsWith("GPT:") && currMsg.fromMe
          ? "assistant"
          : "user";
      messages.unshift({
        role,
        content:
          role === "assistant"
            ? currMsg.body.replace("GPT: ", "")
            : currMsg.body.trim().slice(1).trim().replace("gpt", "").trim(),
      });
      if (currMsg.hasQuotedMsg) {
        const nextQuotedMsg = await currMsg.getQuotedMessage();
        if (!nextQuotedMsg?.body) {
          break;
        }

        if (
          currMsg.body.startsWith("GPT:") &&
          currMsg.fromMe &&
          nextQuotedMsg.fromMe &&
          nextQuotedMsg.body.startsWith("GPT:")
        ) {
          break;
        }

        if (
          !(currMsg.body.startsWith("GPT:") && currMsg.fromMe) &&
          !(nextQuotedMsg.fromMe && nextQuotedMsg.body.startsWith("GPT:"))
        ) {
          break;
        }

        currMsg = nextQuotedMsg;
      } else {
        break;
      }
    }
  }

  const username = config.cf_worker.username;
  const password = config.cf_worker.password;

  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );
  const authHeader = `Basic ${encodedCredentials}`;

  try {
    // Prepare request parameters
    const requestParams: any = {
      ...(!messages?.length && !imageBase64 && { prompt: text }),
      ...(messages?.length && {
        messages: encodeURIComponent(JSON.stringify(messages)),
      }),
      ...(imageBase64 && {
        image: imageBase64,
        prompt: text,
      }),
    };

    // Call GPT model with vision support if image is present
    const response = await axios.get<{ response: string }>(
      `${config.cf_worker.url}gpt`,
      {
        params: requestParams,
        headers: {
          Authorization: authHeader,
        },
      },
    );

    // Save user message and assistant response to persistent history
    await addMessageToHistory(chatId, "gpt", {
      role: "user",
      content: text,
      timestamp: Date.now(),
      ...(imageData && { imageData }),
    });

    await addMessageToHistory(chatId, "gpt", {
      role: "assistant",
      content: response.data.response,
      timestamp: Date.now(),
    });

    // Send the response back to the user
    try {
      await sendLocalized(client, msg, "gpt.response", {
        response: response.data.response,
      });
    } catch (sendError) {
      console.error("Failed to send GPT response:", sendError);
      await client
        .sendMessage(msg.to, `GPT: ${response.data.response}`)
        .catch((altSendError) => {
          console.error(
            "Failed to send alternative GPT response:",
            altSendError,
          );
        });
    }
  } catch (generationError) {
    console.error("GPT generation failed:", generationError);
    await sendLocalized(client, msg, "gpt.generation_failed");
  }
};

const command: Command = {
  name: "gpt",
  description: "gpt.description",
  command: "!gpt",
  commandType: "plugin",
  isDependent: false,
  help: "gpt.help",
  execute,
  public: true,
};

export default command;
