import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import scalc from "scalc";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  if (!args[0]) {
    return await sendLocalized(client, msg, "calc.no_argument");
  }

  try {
    const expression = args.join(" ");
    const result = scalc(expression);
    return await sendLocalized(client, msg, "calc.success", {
      expression,
      result,
    });
  } catch {
    return await sendLocalized(client, msg, "calc.error");
  }
};

const command: Command = {
  name: "calc.name",
  description: "calc.description",
  command: "!calc",
  commandType: "plugin",
  isDependent: false,
  help: "calc.help",
  execute,
  public: true,
};

export default command;
