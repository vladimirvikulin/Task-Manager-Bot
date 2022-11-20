'use strict';

require('dotenv').config();
const {
  Telegraf,
  Markup,
} = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const { connectDatabase, users } = require('./db.js');
const myConsts = require('./consts');
connectDatabase();
let obj;
let tasksList;
bot.start(async (ctx) => {
  await ctx.reply(`Привет ${ctx.message.from.first_name}, этот бот создан для планировки задач.\nНапиши команду /help, чтобы узнать команды бота.`);
  const userExists = await users.findOne({ username: ctx.message.from.username });
  if (userExists === null) users.insertOne({ username: `${ctx.message.from.username}`, chatId: `${ctx.chat.id}`, tasks: [] });
  obj = await users.findOne({ chatId: String(ctx.chat.id) });
  tasksList = obj.tasks;
});

bot.help((ctx) => ctx.reply(myConsts.commands));

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
