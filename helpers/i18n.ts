import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

type Language = "en" | "yue";
type Translations = Record<string, string>;
const translations: Record<Language, Translations> = {
  en: {},
  yue: {},
};

// Determine the correct directory for locales
// __dirname is not available in ES modules, so we use import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, "..", "locales");

function loadTranslations(): void {
  try {
    const enData = fs.readFileSync(path.join(localesDir, "en.json"), "utf-8");
    translations.en = JSON.parse(enData);
  } catch (error) {
    console.error("Failed to load en.json:", error);
    // Fallback to empty or minimal English translations if loading fails
    translations.en = {
      GENERAL_ERROR:
        "An unexpected error occurred. English locale file missing.",
    };
  }

  try {
    const yueData = fs.readFileSync(path.join(localesDir, "yue.json"), "utf-8");
    translations.yue = JSON.parse(yueData);
  } catch (error) {
    console.error("Failed to load yue.json:", error);
    // Fallback to English if Cantonese loading fails
    translations.yue = { GENERAL_ERROR: "發生意外錯誤。廣東話語言檔案遺失。" };
  }
}

// Load translations at startup
loadTranslations();

/**
 * Gets a localized string.
 * @paratargetLangm key The key of the string to retrieve.
 * @param lang The target language ('yue' or 'en').
 * @param params Optional parameters to interpolate into the string.
 *   Example: { name: "World" } for a string like "Hello, {name}!"
 * @returns The localized and interpolated string. Falls back to English if key not found in target lang,
 *          then to the key itself if not found in English.
 */
export function getString(
  key: string,
  lang: Language,
  params?: Record<string, any>,
): string {
  let str = translations[lang]?.[key] || translations.en?.[key] || key;
  console.log(lang, str, translations);

  if (params) {
    for (const paramKey in params) {
      if (Object.prototype.hasOwnProperty.call(params, paramKey)) {
        const value = params[paramKey];
        str = str.replace(new RegExp(`{${paramKey}}`, "g"), String(value));
      }
    }
  }
  return str;
}

// Optional: A function to reload translations if needed at runtime, though not typical for this setup.
// export function reloadTranslations(): void {
//   loadTranslations();
// }
