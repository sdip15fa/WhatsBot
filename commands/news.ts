//jshint esversion:6

import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import { sendLocalized } from "../helpers/localizedMessenger.js";

const execute = async (client: Client, msg: Message, args: string[]) => {
  const category = args[0]?.toLowerCase() || "general";

  const validCategories = [
    "general",
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
    "technology",
  ];

  if (!validCategories.includes(category)) {
    await msg.reply(
      `❌ Invalid category. Valid categories: ${validCategories.join(", ")}`
    );
    return;
  }

  try {
    // Using NewsAPI - requires API key in environment
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      // Fallback to free news API without key
      const response = await fetch(
        `https://saurav.tech/NewsAPI/top-headlines/category/${category}/us.json`
      );

      if (!response.ok) {
        await sendLocalized(client, msg, "news.error");
        return;
      }

      const data = await response.json();
      const articles = data.articles?.slice(0, 5) || [];

      if (articles.length === 0) {
        await sendLocalized(client, msg, "news.no_articles");
        return;
      }

      let newsMessage = `📰 *Top ${category.charAt(0).toUpperCase() + category.slice(1)} News*\n\n`;

      articles.forEach((article: any, i: number) => {
        newsMessage += `*${i + 1}. ${article.title}*\n`;
        if (article.description) {
          newsMessage += `${article.description.substring(0, 100)}...\n`;
        }
        newsMessage += `🔗 ${article.url}\n\n`;
      });

      await msg.reply(newsMessage);
      return;
    }

    // If API key is available
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}&pageSize=5`
    );

    if (!response.ok) {
      await sendLocalized(client, msg, "news.error");
      return;
    }

    const data = await response.json();
    const articles = data.articles || [];

    if (articles.length === 0) {
      await sendLocalized(client, msg, "news.no_articles");
      return;
    }

    let newsMessage = `📰 *Top ${category.charAt(0).toUpperCase() + category.slice(1)} News*\n\n`;

    articles.forEach((article: any, i: number) => {
      newsMessage += `*${i + 1}. ${article.title}*\n`;
      if (article.description) {
        newsMessage += `${article.description.substring(0, 100)}...\n`;
      }
      newsMessage += `🔗 ${article.url}\n\n`;
    });

    await msg.reply(newsMessage);
  } catch (error) {
    console.error("Error fetching news:", error);
    await sendLocalized(client, msg, "news.error");
  }
};

const command: Command = {
  name: "News",
  description: "Get latest news headlines",
  command: "!news",
  commandType: "plugin",
  isDependent: false,
  help: undefined,
  execute,
  public: true,
};

export default command;
