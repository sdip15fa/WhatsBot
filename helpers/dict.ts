import axios, { AxiosError } from "axios";

interface definition {
  word: string;
  phonetic: string;
  phonetics: {
    text: string;
    /** audio url */
    audio: string;
  }[];
  origin: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example: string;
      synonyms: string[];
      antonyms: string[];
    }[];
  }[];
}

export default async function dictionary(word: string): Promise<
  | definition
  | {
      status: number | null;
      title: string;
      message: string | null;
      resolution: string | null;
    }
> {
  return await axios
    .get<definition[]>(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    )
    .then((res) => {
      return res.data[0];
    })
    .catch(
      (
        error: AxiosError<{
          title: string;
          message: string;
          resolution: string;
        }>
      ) => {
        return error?.response
          ? {
              status: error?.response.status,
              title: error?.response?.data?.title,
              message: error?.response?.data?.message,
              resolution: error?.response?.data?.resolution,
            }
          : {
              status: null,
              title: "An unknown error occurred",
              message: null,
              resolution: null,
            };
      }
    );
}

(async () => {
  const definition = await dictionary("hello");
  if ("status" in definition) return;
  console.log(`*${definition.word}*
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
}`)
})();
