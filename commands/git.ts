//jshint esversion:8
import whatsapp, { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
const { MessageMedia } = whatsapp;
import axios from "../helpers/axios.js";

async function downloadzip(url: string, name: string) {
  try {
    return {
      status: true,
      data: Buffer.from(
        (await axios.get(url, { responseType: "arraybuffer" })).data,
      ).toString("base64"),
      filename: `${name}.zip`,
      mimetype: "application/zip",
    };
  } catch (err) {
    return {
      status: false,
    };
  }
}

import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
async function gitinfo(url: string, msg: Message) {
  let repo;
  try {
    repo = {
      user: url.split("/")[3],
      repo: url.split("/")[4].split("?")[0],
    };
    if (repo.user == undefined || repo.repo == undefined)
      throw Error("Invalid url.");
  } catch (err) {
    return {
      status: false,
      msg: "git.invalid_url",
    };
  }

  try {
    const repodata = (
      await axios.get(`https://api.github.com/repos/${repo.user}/${repo.repo}`)
    ).data;
    const targetLang = await getGroupLanguage(msg);

    return {
      status: true,
      msg: `*${repodata.name}* - _${
        repodata.description ? repodata.description : ""
      }_\n\n${getString("git.author", targetLang)}: ${
        repodata.owner.login
      }\n${getString("git.total_stars", targetLang)}: ${
        repodata.stargazers_count
      }\n${getString("git.total_forks", targetLang)}: ${
        repodata.forks
      }\n${getString("git.license", targetLang)}: ${
        repodata.license
          ? repodata.license.name
          : getString("git.no_license", targetLang)
      }`,
      data: await downloadzip(
        `https://github.com/${repo.user}/${repo.repo}/archive/${repodata.default_branch}.zip`,
        repodata.name,
      ),
    };
  } catch (err) {
    return {
      status: false,
      msg: "git.repo_not_available",
    };
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const data = await gitinfo(args[0], msg);
  if (data.status) {
    if (data.data.status) {
      try {
        await client.sendMessage(
          msg.to,
          new MessageMedia(
            data.data.mimetype,
            data.data.data,
            data.data.filename,
          ),
        );
      } catch (e) {
        console.error("Failed to send git zip file:", e);
        // await sendLocalized(client, msg, "git.send_zip_error");
      }
    }
    await client.sendMessage(msg.to, data.msg);
  } else {
    const errorPrefix = getString(
      "git.error_prefix",
      await getGroupLanguage(msg),
    );
    await client.sendMessage(
      msg.to,
      `🙇‍♂️ *${errorPrefix}*\n\n` + "```" + data.msg + "```",
    );
  }
};

const command: Command = {
  name: "Git Info",
  description: "git.description",
  command: "!git",
  commandType: "plugin",
  isDependent: false,
  help: "git.help",
  execute,
  public: false,
};

export default command;
