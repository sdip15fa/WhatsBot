//jshint esversion:8
import weatherjs, { WeatherData } from "weather-js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";

async function fetchweather(query: string): Promise<WeatherData[] | "error"> {
  const weatherfind = new Promise<WeatherData[] | "error">((resolve) => {
    weatherjs.find({ search: query, degreeType: "C" }, function (err, result) {
      if (err) {
        resolve("error");
      } else {
        resolve(result);
      }
    });
  });
  return weatherfind;
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const data = await fetchweather(args.join(" "));
  if (data == "error") {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch Weather```",
    );
  } else if (data instanceof Array) {
    const weather = data[0];
    await client.sendMessage(
      chatId,
      `*Today's Weather at ${weather.location.name}*\n` +
        "```" +
        weather.current.skytext +
        " (" +
        weather.current.temperature +
        "°C)```\n*Feelslike:* " +
        "```" +
        weather.current.feelslike +
        "°C```\n*Humidity:* " +
        "```" +
        weather.current.humidity +
        "```",
    );
  }
};

const command: Command = {
  name: "Weather",
  description: "Gets weather info for given location",
  command: "!weather",
  commandType: "plugin",
  isDependent: false,
  help: `*Weather*\n\nLookup a city's weather with this command.\n\n*!weather [Place-Name]*\nTo check a weather`,
  execute,
  public: true,
};

export default command;
