// Import necessary modules and dependencies
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import OpenAI from "openai";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.openai_api_key) {
    return client.sendMessage(
      chatId,
      "Sorry, OpenAI API key not specified in the environment variable.",
    );
  }

  // Extract the text from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg.body) {
    return client.sendMessage(chatId, "Please provide prompt to gpt!");
  }

  const text = args.join(" ") || quotedMsg.body;
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
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: messages?.length ? messages : [{ role: "user", content: text }],
    });
    const response = completion.choices[0].message.content;
    // Send the response back to the user
    try {
      await msg.reply(`GPT: ${response}`);
    } catch (error) {
      console.error(error);
      await client.sendMessage(chatId, `GPT: ${response}`);
    }
  } catch {
    await client.sendMessage(chatId, "GPT generation failed.");
  }

  // Optionally, you can handle conversation history or context here

  // Optionally, update the last execution timestamp in your database
};

const command: Command = {
  name: "gpt",
  description: "Ask GPT (4o-mini)",
  command: "!gpt",
  commandType: "plugin",
  isDependent: false,
  help: `*GPT*\n\nAsk GPT\n\n!gpt [text]`,
  execute,
  public: true,
};

export default command;
