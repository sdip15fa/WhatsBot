import { Client, Message } from "whatsapp-web.js";
import { getGroupLanguage as getGroupLanguageFromDB } from "./groupLangSettingsDB.js";
import { getString } from "./i18n.js";
import config from "../config.js"; // For default bot language

type Language = "en" | "yue";

/**
 * Gets the language preference for a group chat.
 * Falls back to the default bot language if no preference is set.
 * @param msg The message object to get chat context.
 * @returns The target language ('yue' or 'en').
 */
export async function getGroupLanguage(msg: Message): Promise<Language> {
  const chat = await msg.getChat();
  let targetLang: Language = config.default_tr_lang === "yue" ? "yue" : "en"; // Default from config or 'en'

  const groupLang = await getGroupLanguageFromDB(chat.id._serialized);
  if (groupLang) {
    targetLang = groupLang;
  }

  return targetLang;
}

/**
 * Sends a localized text message to the chat.
 * @param client The WhatsApp client instance.
 * @param msg The original message object to reply to or get chat context.
 * @param stringKey The key for the localized string (from en.json/yue.json).
 * @param params Optional parameters to interpolate into the string.
 */
export async function sendLocalized(
  client: Client,
  msg: Message,
  stringKey: string,
  params?: Record<string, any>,
): Promise<Message | void> {
  const chat = await msg.getChat();
  const chatId = chat.id._serialized;

  const targetLang = await getGroupLanguage(msg); // Use the exported function

  const localizedText = getString(stringKey, targetLang, params);

  try {
    return await client.sendMessage(chatId, localizedText);
  } catch (error) {
    console.error(
      `Failed to send localized message for key ${stringKey} to ${chatId}:`,
      error,
    );
    // Fallback: try sending a generic error in English if the primary send failed
    try {
      const genericErrorText = getString("GENERAL_ERROR", "en", {});
      return await client.sendMessage(chatId, genericErrorText);
    } catch (fallbackError) {
      console.error(
        `Failed to send generic fallback error to ${chatId}:`,
        fallbackError,
      );
    }
  }
}
