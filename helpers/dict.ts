import axios, { AxiosError } from "axios";
const { Axios } = axios;

interface definition {
  word?: string;
  phonetic?: string;
  phonetics?: {
    text?: string;
    /** audio url */
    audio?: string;
  }[];
  origin?: string;
  meanings?: {
    partOfSpeech?: string;
    definitions?: {
      definition?: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
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
  return await new Axios()
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
              status: error?.response?.status,
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
