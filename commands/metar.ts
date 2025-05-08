import {
  getGroupLanguage,
  sendLocalized,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";
//jshint esversion:8
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { parse } from "node-html-parser";
import parseMETAR from "metar";
import axios from "../helpers/axios.js";

async function fetchmetar(airport = "VHHH") {
  try {
    const { data } = await axios.get(
      `https://en.allmetsat.com/metar-taf/asia.php?icao=${airport}`,
    );
    const parsed = parse(data);
    const metar = `METAR ${Array.from(parsed.querySelectorAll("p"))
      .filter((v) => v.innerText.startsWith("METAR"))[0]
      .innerText.split(" ")
      .filter((v, i) => i !== 0)
      .join(" ")}`.trim();

    return {
      ...parseMETAR(metar),
      original: metar,
      special_weather_conditions: metar.split(" ").pop(),
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const airport = args[0];
  const data = await fetchmetar(airport || "VHHH");
  if (!data) {
    await client.sendMessage(
      chatId,
      getString("metar.fetch_error", await getGroupLanguage(msg)),
    );
  } else {
    const date = new Date(data.time);
    await client.sendMessage(chatId, data.original);
    await client.sendMessage(
      chatId,
      `${getString("metar.prefix", await getGroupLanguage(msg))} ${data.station}
${date.toLocaleDateString("en-UK", {
  timeZone: "UTC",
})} ${date.toLocaleTimeString("en-UK", { timeZone: "UTC" })} UTC
${getString("metar.wind", await getGroupLanguage(msg))} ${
        data.wind.direction
      }° ${data.wind.speed}${data.wind.unit}${
        data.wind.gust
          ? ` ${getString("metar.gusting", await getGroupLanguage(msg))} ${
              data.wind.gust
            }${data.wind.unit}`
          : ""
      }
${getString("metar.visibility", await getGroupLanguage(msg))} ${
        data.visibility === 9999
          ? getString("metar.visibility_over", await getGroupLanguage(msg), {
              distance: 9999,
            })
          : `${data.visibility}km`
      }
${getString("metar.weather", await getGroupLanguage(msg))} ${
        data.weather
          ?.sort((a, b) => a.abbreviation.length - b.abbreviation.length)
          .map((v) => {
            if (v.abbreviation.length === 1) {
              return v.abbreviation;
            }
            return v.meaning;
          })
          .join(" ") ||
        getString("metar.no_special_weather", await getGroupLanguage(msg))
      }
${getString("metar.clouds", await getGroupLanguage(msg))} ${
        data.clouds?.map((v) => `${v.meaning} ${v.altitude}ft`).join(", ") ||
        getString("metar.clouds_none", await getGroupLanguage(msg))
      }
${getString("metar.temperature", await getGroupLanguage(msg))} ${
        data.temperature
      }.${data.dewpoint}°C
${getString("metar.qnh", await getGroupLanguage(msg))} ${
        data.altimeterInHpa
      } hPa
${data.special_weather_conditions}`,
    );
  }
};

const command: Command = {
  name: "METAR",
  description: "metar.description",
  command: "!metar",
  commandType: "plugin",
  isDependent: false,
  help: "metar.help",
  execute,
  public: true,
};

export default command;
