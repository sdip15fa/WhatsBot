import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import dictionary from "../helpers/dict.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args[0]) {
    return await sendLocalized(client, msg, "dict.no_argument");
  }

  const definition = await dictionary(args.join(" "));

  if (typeof definition === "object" && "status" in definition) {
    await sendLocalized(
      client,
      msg,
      definition.status ? "dict.error_with_status" : "dict.unknown_error",
      definition.status
        ? { status: definition.status, title: definition.title }
        : {},
    );
  } else {
    const targetLang = await getGroupLanguage(msg);
    await client.sendMessage(
      chatId,
      `*${definition.word}*
${
  definition.phonetics?.length
    ? `\n*${getString("dict.phonetics", targetLang)}*

${definition.phonetics
  ?.map(
    (phonetic, index) =>
      `${index + 1}.${
        phonetic.text
          ? `\n${getString("dict.text", targetLang)}: ${phonetic.text}`
          : ""
      }${
        phonetic.audio
          ? `\n${getString("dict.audio", targetLang)}: ${phonetic.audio}`
          : ""
      }`,
  )
  ?.join("\n\n")}\n`
    : ""
}
*${getString("dict.meanings", targetLang)}*

${definition.meanings
  ?.map(
    (meaning) =>
      `*${meaning?.partOfSpeech}*

${meaning.definitions
  ?.map(
    (def, index) =>
      `${index + 1}. ${def?.definition}${
        def?.example
          ? `\n_${getString("dict.example", targetLang)}_:
${def?.example}`
          : ""
      }${
        def?.synonyms?.length
          ? `\n_${getString("dict.synonyms", targetLang)}_
${def?.synonyms?.map((synonym) => `- ${synonym}`)?.join("\n")}`
          : ""
      }${
        def.antonyms?.length
          ? `\n_${getString("dict.antonyms", targetLang)}_
${def?.antonyms?.map((antonym) => `- ${antonym}`)?.join("\n")}`
          : ""
      }`,
  )
  ?.join("\n\n")}`,
  )
  ?.join("\n\n")}${
        definition?.origin
          ? `\n\n*${getString("dict.origin", targetLang)}*:
${definition?.origin}`
          : ""
      }`,
    );
  }
};

const command: Command = {
  name: "Dictionary",
  description: "dict.description",
  command: "!dict",
  commandType: "plugin",
  isDependent: false,
  help: "dict.help",
  execute,
  public: true,
};

export default command;
