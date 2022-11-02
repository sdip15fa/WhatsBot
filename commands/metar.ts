//jshint esversion:8
// @ts-ignore
import axios from "axios";
import { Client, Message } from "whatsapp-web.js";
import { parse } from "node-html-parser";
import parseMETAR from "metar";

async function fetchmetar() {
  try {
    const { data } = await axios.get(
      "https://www.hko.gov.hk/aviat/metar_eng_revamp.json"
    );
    const parsed = parse(data.metar_decode_eng_json.content.table.content);
    const metar = parsed.querySelector("p").innerText;
    return {
      ...parseMETAR(metar),
      original: metar,
      special_weather_conditions: metar.split(" ").pop(),
    };
  } catch {
    return null;
  }
}

const execute = async (client: Client, msg: Message) => {
  const chatId = (await msg.getChat()).id._serialized;
  const data = await fetchmetar();
  if (!data) {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` + "```Something Unexpected Happened to fetch METAR```"
    );
  } else {
    const date = new Date(data.time);
    await client.sendMessage(chatId, data.original);
    await client.sendMessage(
      chatId,
      `METAR ${data.station}
${date.toLocaleDateString("en-UK", {
  timeZone: "UTC",
})} ${date.toLocaleTimeString("en-UK", { timeZone: "UTC" })} UTC
Wind ${data.wind.direction}° ${data.wind.speed}${data.wind.unit}${
        data.wind.gust ? ` Gusting ${data.wind.gust}${data.wind.unit}` : ""
      }
Visibility ${data.visibility === 9999 ? "over 9999" : data.visibility}m
${data.weather
  ?.sort((a, b) => a.abbreviation.length - b.abbreviation.length)
  .map((v) => {
    if (v.abbreviation.length === 1) {
      return v.abbreviation;
    }
    return v.meaning;
  })
  .join(" ")}
Clouds ${data.clouds?.map((v) => `${v.meaning} ${v.altitude}m`).join(", ")}
Temperature ${data.temperature}.${data.dewpoint}°C
QNH ${data.altimeterInHpa} hPa
${data.special_weather_conditions}`
    );
  }
};

module.exports = {
  name: "METAR",
  description: "Gets METAR info",
  command: "!metar",
  commandType: "plugin",
  isDependent: false,
  help: `*METAR*\n\nMETAR broadcast.\n\n*!metar*\nTo get METAR info.`,
  execute,
  public: true,
};
