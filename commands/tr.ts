//jshint esversion:8
import translate from "@iamtraction/google-translate";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import config from "../config.js";
import tr_languages from "../helpers/tr_languages.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

async function translator(langReq: string, text: string) {
  let lang: string;
  if (!langReq || langReq == "def") {
    lang = config.default_tr_lang;
  } else {
    lang = langReq;
  }

  return translate(text, { to: lang })
    .then((res) => {
      return {
        original: text,
        ori_lang: res.from.language.iso,
        translated: res.text,
        trans_lang: lang,
      };
    })
    .catch(() => {
      return "error";
    });
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;

  if (msg.hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage();
    const langText = getLanguageandText(args);
    data = await translator(langText.lang, quotedMsg.body);
  } else {
    const langText = getLanguageandText(args);
    data = await translator(langText.lang, langText.text);
  }

  if (data == "error") {
    await sendLocalized(client, msg, "tr.error");
  } else if (typeof data !== "string") {
    await sendLocalized(client, msg, "tr.success", {
      ori_lang: data.ori_lang,
      original: data.original,
      trans_lang: data.trans_lang,
      translated: data.translated,
    });
  }
};

function getLanguageandText(args: string[]) {
  let lang;
  let text;

  if (args[0]) {
    const getLangFromFullname = tr_languages().find(
      (fullName) => fullName.matchName === args[0].toLowerCase(),
    ); // match the full name
    const getLangFromCode = tr_languages().find(
      (shortName) => shortName.code === args[0].toLowerCase(),
    ); // match the lang code

    if (getLangFromFullname || getLangFromCode) {
      // its mean firt argument is a language
      lang = (getLangFromCode || getLangFromFullname).code;
      text = args.slice(1).join(" ");
    } else {
      noLangArgs();
    }
  } else {
    noLangArgs();
  }

  function noLangArgs() {
    lang = config.default_tr_lang || "en";
    text = args.join(" ");
  }

  return { lang, text };
}

const command: Command = {
  name: "Translator",
  description: "Translates given text to requested language",
  command: "!tr",
  commandType: "plugin",
  isDependent: false,
  help: `*Translator*\n\nIt will translate text in different languages.\n\n_Usage:_\n1. *!tr [Text]*\n2. Reply with *!tr*\n3. *!tr [Output-Language] [Text]*\n4.Reply with \n*!tr [Output-Language]*`,
  execute,
  public: true,
};

export default command;
