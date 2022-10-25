import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { write, clean } from "./manage";
import readline from "readline";

clean();

const client = new Client({
  puppeteer: { headless: true, args: ["--no-sandbox"] },
  authStrategy: new LocalAuth({ clientId: "whatsbot" }),
});

let password = "";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Enter password to encrypt session (You need to put this in ENV): ",
  (answer: string) => {
    password = answer;
    console.log("Password set to:", password);
    console.log("Generating QR Code...");
    rl.close();
    client.initialize();
  }
);

client.on("qr", (qr: any) => {
  console.log(`Scan this QR Code and copy the JSON\n`);
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  client.destroy();
  console.log("Please wait...");
  // wait because filesystem is busy
  setTimeout(async () => {
    console.log("Session has been created");
    await write(password);
    process.exit();
  }, 3000);
});