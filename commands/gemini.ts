import { sendLocalized } from "../helpers/localizedMessenger.js";
// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.gemini_api_key) {
    return sendLocalized(client, msg, "gemini.not_available");
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return sendLocalized(client, msg, "gemini.no_prompt");
  }

  // const searchWithGoogle = args[0] === "google";
  // if (searchWithGoogle) {
  //   args.shift();
  // }

  const prompt = args.join(" ") || (quotedMsg && quotedMsg.body);
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
    // Attempting to use the original genAI.chats.create structure
    const chatSession = await genAI.chats.create({
      // Using .chats.create as in original
      model: "gemini-2.5-flash-preview-04-17",
      history: history,
      // config from original, 'thinkingConfig' might be specific to their version/setup
      config: {
        // thinkingConfig: {
        //   includeThoughts: false,
        // },
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

    // Attempting to use original sendMessage structure
    const result = await chatSession.sendMessage({
      message: prompt,
    });

    // Attempting to access response text as in original (result.text)
    // Note: Standard SDK usually is result.response.text()
    const textResponse = result.text;

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
