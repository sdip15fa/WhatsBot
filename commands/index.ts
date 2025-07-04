import afk from "./afk.js";
import chatlist from "./chatlist.js";
import dict from "./dict.js";
import gpt from "./gpt.js";
import cleargpt from "./cleargpt.js";
import mute from "./mute.js";
import qr from "./qr.js";
import sticker from "./sticker.js";
import unmute from "./unmute.js";
import allow from "./allow.js";
import count from "./count.js";
import directlink from "./directlink.js";
import help from "./help.js";
import nato from "./nato.js";
import schedule from "./schedule.js";
import story from "./story.js";
import unschedule from "./unschedule.js";
import awake from "./awake.js";
import courier from "./courier.js";
import disable from "./disable.js";
import imdb from "./imdb.js";
import nick from "./nick.js";
import shorten from "./shorten.js";
import term from "./term.js";
import weakness from "./weakness.js";
import block from "./block.js";
import covid from "./covid.js";
import dldsong from "./dldsong.js";
import nopm from "./nopm.js";
import song from "./song.js";
import time from "./time.js";
import weather from "./weather.js";
import calc from "./calc.js";
import crypto from "./crypto.js";
import enable from "./enable.js";
import media from "./media.js";
import ocr from "./ocr.js";
import spam from "./spam.js";
import tr from "./tr.js";
import yt from "./yt.js";
import carbon from "./carbon.js";
import del from "./delete.js";
import git from "./git.js";
import metar from "./metar.js";
import ping from "./ping.js";
import start from "./start.js";
import ud from "./ud.js";
import gif from "./gif.js";
import ratelimit from "./ratelimit.js";
import flip from "./flip.js";
import eight_ball from "./eight_ball.js";
import dice from "./dice.js";
import hangman from "./hangman.js";
import ttt from "./ttt.js";
import hm from "./hm.js";
import llama from "./llama.js";
import chess from "./chess.js";
import autoreply from "./autoreply.js";
import pick from "./pick.js";
import transcribe from "./transcribe.js";
import dse from "./dse.js";
import suicide from "./suicide.js";
import sd from "./sd.js";
import gemini from "./gemini.js";
import wf from "./wf.js";
import chm from "./chm.js";
import blacklist from "./blacklist.js";
import joke from "./joke.js";
import evilllama from "./evilllama.js";
import ds from "./ds.js";
import setlang from "./setlang.js"; // Added import for setlang
import { Command } from "../types/command.js";

export const commands = new Map<string, Command>();

commands.set(afk.command.slice(1), afk);
commands.set(chatlist.command.slice(1), chatlist);
commands.set(dict.command.slice(1), dict);
commands.set(gpt.command.slice(1), gpt);
commands.set(cleargpt.command.slice(1), cleargpt);
commands.set(mute.command.slice(1), mute);
commands.set(qr.command.slice(1), qr);
commands.set(sticker.command.slice(1), sticker);
commands.set(unmute.command.slice(1), unmute);
commands.set(allow.command.slice(1), allow);
commands.set(count.command.slice(1), count);
commands.set(directlink.command.slice(1), directlink);
commands.set(help.command.slice(1), help);
commands.set(nato.command.slice(1), nato);
commands.set(schedule.command.slice(1), schedule);
commands.set(story.command.slice(1), story);
commands.set(unschedule.command.slice(1), unschedule);
commands.set(awake.command.slice(1), awake);
commands.set(courier.command.slice(1), courier);
commands.set(disable.command.slice(1), disable);
commands.set(imdb.command.slice(1), imdb);
commands.set(nick.command.slice(1), nick);
commands.set(shorten.command.slice(1), shorten);
commands.set(term.command.slice(1), term);
commands.set(weakness.command.slice(1), weakness);
commands.set(block.command.slice(1), block);
commands.set(covid.command.slice(1), covid);
commands.set(dldsong.command.slice(1), dldsong);
commands.set(nopm.command.slice(1), nopm);
commands.set(song.command.slice(1), song);
commands.set(time.command.slice(1), time);
commands.set(weather.command.slice(1), weather);
commands.set(calc.command.slice(1), calc);
commands.set(crypto.command.slice(1), crypto);
commands.set(enable.command.slice(1), enable);
commands.set(media.command.slice(1), media);
commands.set(ocr.command.slice(1), ocr);
commands.set(spam.command.slice(1), spam);
commands.set(tr.command.slice(1), tr);
commands.set(yt.command.slice(1), yt);
commands.set(carbon.command.slice(1), carbon);
commands.set(del.command.slice(1), del);
commands.set(git.command.slice(1), git);
commands.set(metar.command.slice(1), metar);
commands.set(ping.command.slice(1), ping);
commands.set(start.command.slice(1), start);
commands.set(ud.command.slice(1), ud);
commands.set(gif.command.slice(1), gif);
commands.set(ratelimit.command.slice(1), ratelimit);
commands.set(flip.command.slice(1), flip);
commands.set(eight_ball.command.slice(1), eight_ball);
commands.set(dice.command.slice(1), dice);
commands.set(hangman.command.slice(1), hangman);
commands.set(hm.command.slice(1), hm);
commands.set(ttt.command.slice(1), ttt);
commands.set(llama.command.slice(1), llama);
commands.set(chess.command.slice(1), chess);
commands.set(autoreply.command.slice(1), autoreply);
commands.set(pick.command.slice(1), pick);
commands.set(transcribe.command.slice(1), transcribe);
commands.set(dse.command.slice(1), dse);
commands.set(suicide.command.slice(1), suicide);
commands.set(sd.command.slice(1), sd);
commands.set(gemini.command.slice(1), gemini);
commands.set(wf.command.slice(1), wf);
commands.set(chm.command.slice(1), chm);
commands.set(blacklist.command.slice(1), blacklist);
commands.set(joke.command.slice(1), joke);
commands.set(evilllama.command.slice(1), evilllama);
commands.set(ds.command.slice(1), ds);
commands.set(setlang.command.slice(1), setlang); // Added setlang to the map
