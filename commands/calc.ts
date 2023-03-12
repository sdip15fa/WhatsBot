import { Client, Message } from "whatsapp-web.js";
import scalc from "scalc";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  if (!args[0]) {
    return await client.sendMessage(chatId, "Please provide an argument.");
  }

  try {
    const result = scalc(args.join(" "));
    return await client.sendMessage(
      chatId,
      `${args.join(" ")}
= ${result}`
    );
  } catch {
    return await client.sendMessage(chatId, "An error occured.");
  }
};

export default {
  name: "Calculator",
  description: "Calculate an expression",
  command: "!calc",
  commandType: "plugin",
  isDependent: false,
  help: `*Calculator*\n\nCalculate an expression with this command.\n\n*!calc [expression]*\nTo calculate an expression.\n\n*!calc <expression>*\nTo calculate an expression.\n\nExample: !calc sin(90) + PI`,
  execute,
  public: true,
};
