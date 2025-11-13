//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

interface Poll {
  question: string;
  options: string[];
  votes: Map<number, Set<string>>;
  chatId: string;
}

const polls: Map<string, Poll> = new Map();

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chat = await msg.getChat();

  if (!chat.isGroup) {
    await sendLocalized(client, msg, "poll.group_only");
    return;
  }

  if (args.length === 0) {
    await sendLocalized(client, msg, "poll.no_argument");
    return;
  }

  const subCommand = args[0].toLowerCase();

  if (subCommand === "create") {
    // Parse question and options
    // Format: !poll create "Question?" "Option 1" "Option 2" "Option 3"
    const input = args.slice(1).join(" ");
    const matches = input.match(/"([^"]*)"/g);

    if (!matches || matches.length < 3) {
      await sendLocalized(client, msg, "poll.create.invalid_format");
      return;
    }

    const question = matches[0].replace(/"/g, "");
    const options = matches.slice(1).map((opt) => opt.replace(/"/g, ""));

    if (options.length > 10) {
      await sendLocalized(client, msg, "poll.create.too_many_options");
      return;
    }

    const poll: Poll = {
      question,
      options,
      votes: new Map(),
      chatId: chat.id._serialized,
    };

    polls.set(chat.id._serialized, poll);

    let pollMessage = `📊 *Poll*\n\n*${question}*\n\n`;
    options.forEach((opt, i) => {
      pollMessage += `${i + 1}. ${opt}\n`;
    });
    pollMessage += `\nVote using: !poll vote [number]`;

    await msg.reply(pollMessage);
    return;
  }

  if (subCommand === "vote") {
    const poll = polls.get(chat.id._serialized);

    if (!poll) {
      await sendLocalized(client, msg, "poll.no_active_poll");
      return;
    }

    const voteNumber = parseInt(args[1]);

    if (isNaN(voteNumber) || voteNumber < 1 || voteNumber > poll.options.length) {
      await sendLocalized(client, msg, "poll.vote.invalid_option");
      return;
    }

    const voter = msg.author || msg.from;

    // Remove previous votes from this user
    poll.votes.forEach((voters) => voters.delete(voter));

    // Add new vote
    if (!poll.votes.has(voteNumber - 1)) {
      poll.votes.set(voteNumber - 1, new Set());
    }
    poll.votes.get(voteNumber - 1)!.add(voter);

    await msg.reply(`✅ Vote recorded for option ${voteNumber}!`);
    return;
  }

  if (subCommand === "results") {
    const poll = polls.get(chat.id._serialized);

    if (!poll) {
      await sendLocalized(client, msg, "poll.no_active_poll");
      return;
    }

    let resultsMessage = `📊 *Poll Results*\n\n*${poll.question}*\n\n`;

    const totalVotes = Array.from(poll.votes.values()).reduce(
      (sum, voters) => sum + voters.size,
      0
    );

    poll.options.forEach((opt, i) => {
      const votes = poll.votes.get(i)?.size || 0;
      const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
      const bar = "█".repeat(Math.round((votes / Math.max(totalVotes, 1)) * 10));
      resultsMessage += `${i + 1}. ${opt}\n${bar} ${votes} votes (${percentage}%)\n\n`;
    });

    resultsMessage += `Total votes: ${totalVotes}`;

    await msg.reply(resultsMessage);
    return;
  }

  if (subCommand === "end") {
    const poll = polls.get(chat.id._serialized);

    if (!poll) {
      await sendLocalized(client, msg, "poll.no_active_poll");
      return;
    }

    // Show final results
    const totalVotes = Array.from(poll.votes.values()).reduce(
      (sum, voters) => sum + voters.size,
      0
    );

    let resultsMessage = `📊 *Final Poll Results*\n\n*${poll.question}*\n\n`;

    poll.options.forEach((opt, i) => {
      const votes = poll.votes.get(i)?.size || 0;
      const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
      const bar = "█".repeat(Math.round((votes / Math.max(totalVotes, 1)) * 10));
      resultsMessage += `${i + 1}. ${opt}\n${bar} ${votes} votes (${percentage}%)\n\n`;
    });

    resultsMessage += `Total votes: ${totalVotes}\n\nPoll ended.`;

    await msg.reply(resultsMessage);
    polls.delete(chat.id._serialized);
    return;
  }

  await sendLocalized(client, msg, "poll.invalid_command");
};

const command: Command = {
  name: "Poll",
  description: "Create polls in groups",
  command: "!poll",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
