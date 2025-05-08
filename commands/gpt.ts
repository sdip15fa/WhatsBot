import { sendLocalized } from "../helpers/localizedMessenger.js";
// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import OpenAI from "openai";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.openai_api_key) {
    return sendLocalized(client, msg, "gpt.no_api_key");
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return sendLocalized(client, msg, "gpt.no_prompt");
  }

  const text = args.join(" ") || (quotedMsg && quotedMsg.body);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  if (
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
  try {
    // Call GPT model with the obtained text
    const openai = new OpenAI({ apiKey: config.openai_api_key }); // Ensure API key is passed if not globally configured
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // store: true, // Removed non-standard 'store' parameter
      messages: messages?.length ? messages : [{ role: "user", content: text }],
    });
    const response = completion.choices[0].message.content;
    // Send the response back to the user
    try {
      await sendLocalized(client, msg, "gpt.response", { response: response });
    } catch (sendError) {
      console.error("Failed to send GPT response:", sendError);
      await client
        .sendMessage(msg.to, `GPT: ${response}`)
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

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
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
