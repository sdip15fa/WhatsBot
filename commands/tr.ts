//jshint esversion:8
import translate from "@iamtraction/google-translate";
import { Client, Message } from "whatsapp-web.js";
import config from "../config";
import tr_languages from "../helpers/tr_languages";

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
    .catch((err) => {
      return "error";
    });
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let data;

  if (msg.hasQuotedMsg) {
    let quotedMsg = await msg.getQuotedMessage();
    let langText = getLanguageandText(args);
    data = await translator(langText.lang, quotedMsg.body);
  } else {
    let langText = getLanguageandText(args);
    data = await translator(langText.lang, langText.text);
  }

  if (data == "error") {
    await client.sendMessage(
      msg.to,
      `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened while translate```"
    );
  } else if (typeof data !== "string") {
    await client.sendMessage(
      (
        await msg.getChat()
      ).id._serialized,
      `*Original (${data.ori_lang}) :* ` +
        "```" +
        data.original +
        "```\n\n" +
        `*Translation (${data.trans_lang}) :* ` +
        "```" +
        data.translated +
        "```"
    );
  }
};

function getLanguageandText(args: string[]) {
  let lang;
  let text;

  if (args[0]) {
    let getLangFromFullname = tr_languages().find(
      (fullName) => fullName.matchName === args[0].toLowerCase()
    ); // match the full name
    let getLangFromCode = tr_languages().find(
      (shortName) => shortName.code === args[0].toLowerCase()
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

module.exports = {
  name: "Translator",
  description: "Translates given text to requested language",
  command: "!tr",
  commandType: "plugin",
  isDependent: false,
  help: `*Translator*\n\nIt will translate text in different languages.\n\n_Usage:_\n1. *!tr [Text]*\n2. Reply with *!tr*\n3. *!tr [Output-Language] [Text]*\n4.Reply with \n*!tr [Output-Language]*`,
  execute,
};
