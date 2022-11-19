import { Agenda, Job } from "agenda";
import { MessageMedia } from "whatsapp-web.js";
import { client } from "../db";
import { wtsClient } from "../main";
import { countMessage } from "./count";
import { getDate } from "./date";

export const agenda = new Agenda({ mongo: client.db("agenda") });

agenda.define(
  "send count",
  async (
    job: Job & {
      attrs: {
        data: {
          groupId: string;
        };
      };
    }
  ) => {
    const { groupId } = job.attrs.data;
    const date = getDate();

    wtsClient.sendMessage(
      groupId,
      await countMessage(
        groupId,
        (await wtsClient.getChatById(groupId)).name || "",
        date
      )
    );
  }
);

agenda.define(
  "send message",
  async (
    job: Job & {
      attrs: {
        data: {
          chatId: string;
          body?: string;
          sticker?: boolean;
          media?: MessageMedia;
        };
      };
    }
  ) => {
    const { chatId, body, sticker, media } = job.attrs.data;
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
