//jshint esversion:8
// @ts-ignore
import weatherjs from "weather-js";
import { Client, Message } from "whatsapp-web.js";

async function fetchweather(query: string) {
  const weatherfind = new Promise((resolve, reject) => {
    weatherjs.find({ search: query, degreeType: "C" }, function (err: Error, result: any) {
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
  msg.delete(true);
  const data = await fetchweather(args.join(" "));
  if (data == "error") {
    await client.sendMessage(
      msg.to,
      `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch Weather```"
    );
  } else if (data instanceof Array) {
    const weather = data[0];
    await client.sendMessage(
      msg.to,
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
        "```"
    );
  }
};

module.exports = {
  name: "Weather",
  description: "Gets weather info for given location",
  command: "!weather",
  commandType: "plugin",
  isDependent: false,
  help: `*Weather*\n\nLookup a city's weather with this command.\n\n*!weather [Place-Name]*\nTo check a weather`,
  execute,
};
