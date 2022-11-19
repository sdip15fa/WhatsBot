import { Agenda, Job } from "agenda";
import { MessageMedia } from "whatsapp-web.js";
import db, { client } from "../db";
import { wtsClient } from "../main";
import { getDate } from "./date";

export const agenda = new Agenda({ mongo: client.db("agenda") });

agenda.define("send count", async (job: Job) => {
  const { groupId } = job.attrs.data;
  const date = getDate();
  const count = (
    await db("count").coll.findOne({
      groupId,
      date,
    })
  )?.count;

  if (count) {
    wtsClient.sendMessage(
      groupId,
      `Messages ${date}:
${count}`
    );
  }
});

agenda.define(
  "send message",
  async (
    job: Job & {
      data: {
        chatId: string;
        body?: string;
        sticker?: boolean;
        media?: MessageMedia;
      };
    }
  ) => {
    const { chatId, body, sticker, media } = job.data;
    if (!body && !media) return;
    if (sticker) {
      await wtsClient.sendMessage(chatId, media, { sendMediaAsSticker: true });
    }
    if (media && !body) {
      await wtsClient.sendMessage(chatId, media);
    }
    await wtsClient.sendMessage(chatId, body, { ...(media && { media }) });
  }
);
