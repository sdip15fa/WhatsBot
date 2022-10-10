//jshint esversion:8
import axios from "axios";
import { Client, Message } from "whatsapp-web.js";

function yesno(status: boolean) {
  if (status) {
    return "Yes";
  } else {
    return "No";
  }
}

async function emailVerifier(email: string) {
  try {
    let data = (
      await axios({
        method: "post",
        url: "https://validateemail.projects.thetuhin.com/api",
        headers: {
          "thank-you": "tuhin",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ email }),
      })
    ).data;
    if (data.status) {
      let validitystring = data.valid
        ? `valid with ${data.valid_chance}% chance`
        : "invalid";
      return `*${data.query}* is ${validitystring}\n\nDisposable: ${yesno(
        data.disposable
      )}\nFree Provider: ${yesno(data.free)}`;
    } else {
      throw new Error("error");
    }
  } catch (error) {
    return (
      `🙇‍♂️ *Error*\n\n` +
      "```Something Unexpected Happened while validating this email.```"
    );
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  let getdata;
  if (msg.hasQuotedMsg) {
    let quotedMsg = await msg.getQuotedMessage();
    getdata = await emailVerifier(quotedMsg.body);
    quotedMsg.reply(getdata);
  } else {
    getdata = await emailVerifier(args[0]);
    await client.sendMessage(msg.to, getdata);
  }
};

module.exports = {
  name: "Verify Email",
  description: "Verify the credibility of a given email",
  command: "!verifyemail",
  commandType: "plugin",
  isDependent: false,
  help: `*Email Verifier*\n\nTest an Email's validity before it bounce. \n\n*Reply an email with !verifyemail*\nor,\n*!verifyemail [Email Address]*`,
  execute,
  public: false
};
