import { Client, Message } from "whatsapp-web.js";

export interface Command {
  isDependent: boolean;
  commandType: "admin" | "info" | "plugin";
  name: string;
  command: string;
  help: string;
  description?: string;
  public?: boolean;
  execute?: (client: Client, msg: Message, args: string[]) => void;
}
