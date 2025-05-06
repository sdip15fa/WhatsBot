// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.gemini_api_key) {
    return client.sendMessage(chatId, "Sorry, gemini not available.");
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(chatId, "Please provide prompt to gemini!");
  }

  // const searchWithGoogle = args[0] === "google";
  // if (searchWithGoogle) {
  //   args.shift();
  // }

  const prompt = args.join(" ") || quotedMsg.body;
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
    // Instantiate the chat directly using genAI.chats.create()
    const chat = await genAI.chats.create({
      model: "gemini-2.5-flash-preview-04-17",
      history: history,
      config: {
        thinkingConfig: {
          includeThoughts: false,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      },
    });

    const result = await chat.sendMessage({
      message: prompt,
    });

    // Send the response back to the user
    try {
      await msg.reply(`Gemini: ${result.text}`); // Access text as a property
    } catch (error) {
      console.error(error);
      await client.sendMessage(chatId, `Gemini: ${result.text}`); // Access text as a property
    }
  } catch (error) {
    console.error(error);
    await client.sendMessage(chatId, "Gemini generation failed.");
  }
};

const command: Command = {
  name: "gemini",
  description: "Ask Gemini",
  command: "!gemini",
  commandType: "plugin",
  isDependent: false,
  help: `*Gemini*\n\nAsk Gemini\n\n!gemini [text]`,
  execute,
  public: true,
};

export default command;
