import { sendLocalized } from "../helpers/localizedMessenger.js";
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import { GoogleGenAI } from "@google/genai";

const { MessageMedia } = whatsapp;

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;

  if (!config.gemini_api_key) {
    return sendLocalized(client, msg, "imagegen.not_available");
  }

  // Extract the text prompt from the user's message
  const quotedMsg = msg.hasQuotedMsg && (await msg.getQuotedMessage());

  if (!args.length && !quotedMsg?.body) {
    return sendLocalized(client, msg, "imagegen.no_prompt");
  }

  let contextText = "";
  if (quotedMsg?.body) {
    contextText = `${quotedMsg.body}\n\n`;
  }

  const userPrompt = args.join(" ");
  const prompt = contextText + userPrompt;

  if (!prompt) {
    return sendLocalized(client, msg, "imagegen.no_prompt");
  }

  try {
    // Send status message
    await msg.reply("🎨 Generating image with Nano Banana...");

    const genAI = new GoogleGenAI({ apiKey: config.gemini_api_key });

    // Use Gemini 2.5 Flash Image model (Nano Banana)
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    // Extract the generated image from the response
    // The response should contain the image in the candidates
    if (!response.candidates || response.candidates.length === 0) {
      console.error("No candidates in response from Nano Banana");
      await sendLocalized(client, msg, "imagegen.generation_failed");
      return;
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      console.error("No content parts in response from Nano Banana");
      await sendLocalized(client, msg, "imagegen.generation_failed");
      return;
    }

    // Find the image part in the response
    let imageData = null;
    let mimeType = "image/png";

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      console.error("No image data found in Nano Banana response");
      await sendLocalized(client, msg, "imagegen.generation_failed");
      return;
    }

    // Convert the base64 image to MessageMedia
    const media = new MessageMedia(
      mimeType,
      imageData,
      `generated_${Date.now()}.png`,
    );

    // Send the generated image
    await client.sendMessage(chatId, media, {
      caption: `🎨 Generated with Nano Banana\n\n*Prompt:* ${prompt}`,
    });
  } catch (generationError: any) {
    console.error("Nano Banana image generation failed:", generationError);

    // Provide more helpful error messages
    if (generationError.message?.includes("quota")) {
      await msg.reply(
        "❌ API quota exceeded. Please check your Gemini API usage limits.",
      );
    } else if (generationError.message?.includes("safety")) {
      await msg.reply(
        "❌ Image generation blocked due to safety filters. Please try a different prompt.",
      );
    } else {
      await sendLocalized(client, msg, "imagegen.generation_failed");
    }
  }
};

const command: Command = {
  name: "imagegen",
  description: "imagegen.description",
  command: "!imagegen",
  commandType: "plugin",
  isDependent: false,
  help: "imagegen.help",
  execute,
  public: true,
};

export default command;
