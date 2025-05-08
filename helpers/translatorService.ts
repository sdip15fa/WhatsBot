import translate from "@iamtraction/google-translate";
import config from "../config.js"; // For default_tr_lang if needed as a fallback, though our scope is yue/en

/**
 * Translates text to the target language.
 * @param text The text to translate.
 *   Assumed to be in English or auto-detectable by the translation API.
 * @param targetLanguage The target language code ('yue' or 'en').
 * @returns The translated text, or the original text if translation fails or target is English.
 */
export async function translateText(
  text: string,
  targetLanguage: "yue" | "en",
): Promise<string> {
  if (targetLanguage === "en") {
    // Or if source language is already English, but auto-detection handles this.
    return text;
  }

  // Default to English if an unsupported language is somehow passed,
  // though types should prevent this.
  const langTo = targetLanguage === "yue" ? "yue" : "en";

  try {
    const res = await translate(text, { to: langTo });
    // Ensure res.text is a string, as google-translate types can be broad
    if (typeof res.text === "string") {
      return res.text;
    }
    console.error("Translation result text is not a string:", res);
    return text; // Fallback to original text
  } catch (error) {
    console.error("Error during translation:", error);
    return text; // Fallback to original text on error
  }
}
