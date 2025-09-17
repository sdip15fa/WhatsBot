import { sendLocalized } from "../helpers/localizedMessenger.js";
// Import necessary modules and dependencies
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import { GoogleGenAI } from "@google/genai";
const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.gemini_api_key) {
    return sendLocalized(client, msg, "gemini.not_available");
  }

  // Extract the text from the user's message and check for media
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());
  const hasMedia = msg.hasMedia || (quotedMsg && quotedMsg.hasMedia);

  if (!args.length && !quotedMsg?.body && !hasMedia) {
    return sendLocalized(client, msg, "gemini.no_prompt");
  }

  let contextText = "";
  if (quotedMsg?.body) {
    contextText = `Context from quoted message: ${quotedMsg.body}\n\n`;
  }

  const userPrompt = args.join(" ");
  const prompt =
    contextText +
    (userPrompt || (hasMedia ? "What do you see in this image?" : ""));

  // Handle image input
  let imageData = null;
  if (hasMedia) {
    const mediaMsg = msg.hasMedia ? msg : quotedMsg;
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
  const history: { role: "model" | "user"; parts: { text: string }[] }[] = [];

  if (
    args.length &&
    msg.hasQuotedMsg &&
    quotedMsg.fromMe &&
    quotedMsg.body.startsWith("Gemini:")
  ) {
    let currMsg: Message | null = quotedMsg;
    while (currMsg?.body) {
      const role =
        currMsg.body.startsWith("Gemini:") && currMsg.fromMe ? "model" : "user";
      history.unshift({
        role,
        parts: [
          {
            text:
              role === "model"
                ? currMsg.body.replace("Gemini: ", "")
                : currMsg.body
                    .trim()
                    .slice(1)
                    .trim()
                    .replace("gemini", "")
                    .trim(),
          },
        ],
      });
      if (currMsg.hasQuotedMsg) {
        const nextQuotedMsg = await currMsg.getQuotedMessage();
        if (!nextQuotedMsg?.body) {
          break;
        }

        if (
          currMsg.body.startsWith("Gemini:") &&
          currMsg.fromMe &&
          nextQuotedMsg.fromMe &&
          nextQuotedMsg.body.startsWith("Gemini:")
        ) {
          break;
        }

        if (
          !(currMsg.body.startsWith("Gemini:") && currMsg.fromMe) &&
          !(nextQuotedMsg.fromMe && nextQuotedMsg.body.startsWith("Gemini:"))
        ) {
          break;
        }

        currMsg = nextQuotedMsg;
      } else {
        break;
      }
    }
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: config.gemini_api_key });

    // Build content array for the request
    const contentParts = [];

    if (imageData) {
      contentParts.push(imageData);
    }
    contentParts.push(prompt);

    // Use the new SDK structure
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contentParts,
    });

    const textResponse = response.text;

    if (typeof textResponse !== "string") {
      console.error("Gemini response text is not a string:", textResponse);
      throw new Error("Invalid response format from Gemini");
    }

    // Send the response back to the user
    try {
      await sendLocalized(client, msg, "gemini.response", {
        response: textResponse,
      });
    } catch (sendError) {
      console.error("Failed to send Gemini response:", sendError);
      await client
        .sendMessage(msg.to, `Gemini: ${textResponse}`)
        .catch((altSendError) => {
          console.error(
            "Failed to send alternative Gemini response:",
            altSendError,
          );
        });
    }
  } catch (generationError) {
    console.error("Gemini API interaction failed:", generationError);
    await sendLocalized(client, msg, "gemini.generation_failed");
  }
};

const command: Command = {
  name: "gemini",
  description: "gemini.description",
  command: "!gemini",
  commandType: "plugin",
  isDependent: false,
  help: "gemini.help",
  execute,
  public: true,
};

export default command;
