//jshint esversion:8
import weatherjs, { WeatherData } from "weather-js";
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

async function fetchweather(query: string): Promise<WeatherData[] | "error"> {
  const weatherfind = new Promise<WeatherData[] | "error">((resolve) => {
    weatherjs.find({ search: query, degreeType: "C" }, function (err, result) {
      if (err) {
        console.error("Weather.js error:", err);
        resolve("error");
      } else if (!result || result.length === 0) {
        console.error("Weather.js no result for query:", query);
        resolve("error"); // Treat no results as an error for simplicity
      } else {
        resolve(result);
      }
    });
  });
  return weatherfind;
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  // const chatId = (await msg.getChat()).id._serialized; // Not needed directly
  if (!args || args.length === 0) {
    // It might be good to have a WEATHER_NO_LOCATION_PROVIDED key
    await sendLocalized(client, msg, "GENERAL_ERROR", {
      error: "No location provided for weather.",
    }); // Placeholder
    return;
  }
  const data = await fetchweather(args.join(" "));
  if (data == "error" || !data[0]) {
    // Added !data[0] check
    await sendLocalized(client, msg, "WEATHER_ERROR_FETCH");
  } else if (data instanceof Array) {
    // data[0] is guaranteed by previous check
    const weather = data[0];
    await sendLocalized(client, msg, "WEATHER_SUCCESS", {
      locationName: weather.location.name,
      skytext: weather.current.skytext,
      temperature: weather.current.temperature,
      feelslike: weather.current.feelslike,
      humidity: weather.current.humidity,
    });
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
