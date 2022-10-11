import { Client, Message } from "whatsapp-web.js";
import dictionary from "../helpers/dict";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args[0]) {
    return await client.sendMessage(chatId, "Please provide an argument.");
  }

  const definition = await dictionary(args.join(""));

  if ("status" in definition) {
    await client.sendMessage(
      chatId,
      definition.status
        ? `${definition.status} ${definition.title}`
        : "An unknown error occurred."
    );
  } else {
    await client.sendMessage(
      chatId,
      `*${definition.word}*
${
  definition.phonetics.length
    ? `\n*Phonetics*

${definition.phonetics.map(
  (phonetic, index) =>
    `${index + 1}.${phonetic.text ? `\nText: ${phonetic.text}` : ""}${
      phonetic.audio ? `\nAudio: ${phonetic.audio}` : ""
    }`
).join("\n\n")}\n`
    : ""
}
*Meanings*

${definition.meanings
  .map(
    (meaning) =>
      `*${meaning.partOfSpeech}*

${meaning.definitions
  .map(
    (def, index) =>
      `${index + 1}. ${def.definition}${
        def.example
          ? `\n\n_Example_:
${def.example}`
          : ""
      }${
        def.synonyms.length
          ? `\n\n_Synonyms_
${def.synonyms.map((synonym) => `- ${synonym}`).join("\n")}`
          : ""
      }${
        def.antonyms.length
          ? `\n\n_Antonyms_
${def.antonyms.map((antonym) => `- ${antonym}`).join("\n")}`
          : ""
      }`
  )
  .join("\n\n")}`
  )
  .join("\n\n")}${
  definition.origin
    ? `\n\n*Origin*:
${definition.origin}`
    : ""
}`
    );
  }
};

module.exports = {
  name: "Dictionary",
  description: "Get word definition",
  command: "!dict",
  commandType: "plugin",
  isDependent: false,
  help: `*Dictionary*\n\nLookup a word's definition with this command.\n\n*!dict [word]*\nTo check a word`,
  execute,
  public: true,
};
