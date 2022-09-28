import { Client } from "whatsapp-web.js";

export default async function logger(client: Client, text: string) {
  try {
    await client.sendMessage(client.info.wid._serialized, text);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// Example:
// await logger(client, "message");
