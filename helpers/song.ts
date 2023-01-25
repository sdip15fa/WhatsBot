//jshint esversion:8
import axios from "axios";
import fs from "fs";
import path from "path";

export async function search(query: string) {
  try {
    const response = (
      await axios.get(`https://jiosaavn-api.vercel.app/search?query=${query}`)
    ).data;

    if (response.result === "false") {
      throw "not-found";
    } else {
      let content = `*Results for* _'${query}'_\n\n`;
      const songarray = [];
      for (let i = 0; i < response.length; i++) {
        content += `*${i + 1}.* ${response[i].title} - ${
          response[i].more_info.singers
        }\n`;
        songarray.push({ key: i + 1, id: response[i].id });
      }
      content += `\nReply this message with \`\`\`!dldsong [number]\`\`\` to download !\n*Ex.* !dldsong 1`;
      return { status: true, content, songarray };
    }
  } catch (error) {
    return {
      status: false,
      content:
        `🙇‍♂️ *Error*\n\n` +
        "```Result not found for " +
        query +
        ", Please try again with different keyword!```",
      songarray: [],
    };
  }
}

export async function download(songkey: string, id: string) {
  const pretifiedsongkey = Number(songkey.trim());
  try {
    const saveddata: { key: number; id: string }[] = JSON.parse(
      fs.readFileSync(path.join(__dirname, `../cache/song~${id}.json`), "utf8")
    );
    const song = saveddata.find((d) => d.key === pretifiedsongkey);

    if (song) {
      try {
        const data = (
          await axios.get(`https://jiosaavn-api.vercel.app/song?id=${song.id}`)
        ).data;

        return {
          status: true,
          content: {
            text:
              `🎶 *${data.song}* _(${data.year})_\n\n📀 *Artist :*  ` +
              "```" +
              data.singers +
              "```\n📚 *Album :*  " +
              "```" +
              data.album +
              "```" +
              `\n\n*Download Url* 👇\nhttps://musicder-prod.vercel.app/download/${data.id}`,
            image: await image(data.image),
          },
        };
      } catch (w) {
        return {
          status: false,
          content:
            `🙇‍♂️ *Error*\n\n` +
            "```Something went wrong while fetching this song.```",
        };
      }
    } else {
      return {
        status: false,
        content:
          `🙇‍♂️ *Error*\n\n` +
          "```This song key is invalid please send the correct song key.\nEx. !dldsong 1```",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      status: false,
      content:
        `🙇‍♂️ *Error*\n\n` + "```Cache not found please search the song again```",
    };
  }
}

export async function image(link: string) {
  try {
    const respoimage = await axios.get(link, { responseType: "arraybuffer" });

    return {
      mimetype: "image/jpeg",
      data: Buffer.from(respoimage.data).toString("base64"),
      filename: "jiosaavn",
    };
  } catch (error) {
    console.log(error);
    return {
      mimetype: "image/jpeg",
      data: "",
      filename: "jiosaavn",
    };
  }
}
