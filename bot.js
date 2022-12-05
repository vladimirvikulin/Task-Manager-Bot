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
let objDataBase;
const userLocalObj = {
  groups: [],
  text: '',
  taskId: 0,
  groupId: 0,
  action: '',
  activeGroup: 0,
};

//Commands

bot.start(async (ctx) => {
  await ctx.reply(`Привет ${ctx.message.from.first_name}, этот бот создан для планировки задач.\nНапиши команду /help, чтобы узнать команды бота.`);
  const userExists = await users.find({ username: ctx.message.from.username });
  if (userExists === null) {
    users.create({ username: `${ctx.message.from.username}`,
      chatId: `${ctx.chat.id}`,
      activeGroup: 0,
      groups: [] });
  }
});

bot.help((ctx) => ctx.reply(myConsts.commands));

bot.command('addTask', async (ctx) => {
  try {
    await addTask(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('myTasks', async (ctx) => {
  try {
    await myTasks(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('deleteTask', async (ctx) => {
  try {
    await deleteTask(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('updateTask', async (ctx) => {
  try {
    await isCompleted(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('chooseGroup', async (ctx) => {
  try {
    await chooseGroup(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('myGroups', async (ctx) => {
  try {
    await myGroups(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('addGroup', async (ctx) => {
  try {
    await addGroup(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('deleteGroup', async (ctx) => {
  try {
    await deleteGroup(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.command('menu', async (ctx) => {
  await ctx.replyWithHTML('<b>Меню планировщика</b>', Markup.inlineKeyboard(
    [
      [Markup.button.callback('Мои группы 📋', 'myGroups'), Markup.button.callback('Мои задачи 📋', 'myTasks')],
      [Markup.button.callback('Добавить группу ✏️', 'addGroup'), Markup.button.callback('Добавить задачу ✏️', 'addTask')],
      [Markup.button.callback('Удалить группу 🗑️', 'deleteGroup'), Markup.button.callback('Удалить задачу 🗑️', 'deleteTask')],
      [Markup.button.callback('Выбрать группу 📋', 'chooseGroup'), Markup.button.callback('Обновить статус задачи 🔃', 'updateTask')],
    ]
  ));
});

bot.on('text', async (ctx) => {
  userLocalObj.text = ctx.message.text;
  if (userLocalObj.action === 'addTask') {
    await ctx.replyWithHTML(
      'Вы действительно хотите добавить задачу:\n\n' +
        `<i>${ctx.message.text}</i>`,
      yesNoKeyboard()
    );
  } else if (userLocalObj.action === 'deleteTask') {
    userLocalObj.taskId = Number(ctx.message.text) - 1;
    await ctx.replyWithHTML(
      'Вы действительно хотите удалить задачу №' +
      `<i>${userLocalObj.taskId + 1}</i>`,
      yesNoKeyboard()
    );
  } else if (userLocalObj.action === 'isCompleted') {
    userLocalObj.taskId = Number(ctx.message.text) - 1;
    await ctx.replyWithHTML(
      'Вы действительно хотите установить или убрать отметку готовности задачи №' +
      `<i>${userLocalObj.taskId + 1}</i>`,
      yesNoKeyboard()
    );
  } else if (userLocalObj.action === 'addGroup') {
    await ctx.replyWithHTML(
      'Вы действительно хотите добавить группу задач ' +
      `<i>${userLocalObj.text}</i>`,
      yesNoKeyboard()
    );
  } else if (userLocalObj.action === 'chooseGroup') {
    userLocalObj.activeGroup = Number(ctx.message.text) - 1;
    await ctx.reply('Вы успешно выбрали активную группу');
    await updateDataBase(ctx);
    await myGroups(ctx);
  } else if (userLocalObj.action === 'deleteGroup') {
    userLocalObj.groupId = Number(ctx.message.text) - 1;
    await ctx.replyWithHTML(
      'Вы действительно хотите удалить группу №' +
      `<i>${userLocalObj.groupId + 1}</i>`,
      yesNoKeyboard()
    );
  } else {
    await ctx.reply('Неизвестная команда, напишите /help, чтоб узнать список команд');
  }
});

//Functions

async function updateLocalData(ctx) {
  objDataBase = await users.find({ chatId: String(ctx.chat.id) });
  userLocalObj.groups = objDataBase.groups;
  userLocalObj.activeGroup = objDataBase.activeGroup;
}

async function updateDataBase(ctx) {
  await users.update(
    { chatId: String(ctx.chat.id) },
    {
      $set: {
        groups: userLocalObj.groups,
        activeGroup: userLocalObj.activeGroup
      }
    }
  );
}

async function addGroup(ctx) {
  updateLocalData(ctx);
  await ctx.reply('Напишите группу');
  userLocalObj.action = 'addGroup';
}

async function myGroups(ctx) {
  updateLocalData(ctx);
  const groups = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(userLocalObj.groups);
    }, 300);
  });
  let listGroups = '';
  for (let i = 0; i < groups.length; i++) {
    if (i === userLocalObj.activeGroup) {
      listGroups += `${i + 1}. ${groups[i].groupName} 🟢\n`;
    } else {
      listGroups += `${i + 1}. ${groups[i].groupName}\n`;
    }
  }
  await ctx.replyWithHTML(
    '<b>Список ваших групп:</b>\n\n' +
    `${listGroups}`
  );
}

async function chooseGroup(ctx) {
  await myGroups(ctx);
  await ctx.reply('Введите номер группы, чтобы выбрать активную группу');
  userLocalObj.action = 'chooseGroup';
}

async function addTask(ctx) {
  updateLocalData(ctx);
  await ctx.reply('Напишите задачу');
  userLocalObj.action = 'addTask';
}

async function myTasks(ctx) {
  updateLocalData(ctx);
  const tasks = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(userLocalObj.groups[userLocalObj.activeGroup].tasks);
    }, 300);
  });
  let result = '';
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].isCompleted)  result += `${i + 1}. ${tasks[i].taskName} ✅\n`;
    else result += `${i + 1}. ${tasks[i].taskName} 🔴\n`;
  }
  if (result === '') {
    ctx.replyWithHTML(
      '<b>Список ваших задач пуст</b>'
    );
  } else {
    ctx.replyWithHTML(
      '<b>Список ваших задач:</b>\n\n' +
      `${result}`
    );
  }
}

async function deleteGroup(ctx) {
  updateLocalData(ctx);
  await ctx.replyWithHTML(
    'Введите порядковый номер группы, например <b> "5" </b>,чтобы удалить группу №5'
  );
  userLocalObj.action = 'deleteGroup';
}

async function deleteTask(ctx) {
  updateLocalData(ctx);
  await ctx.replyWithHTML(
    'Введите порядковый номер задачи, например <b> "5" </b>,чтобы удалить задачу №5'
  );
  userLocalObj.action = 'deleteTask';
}

async function isCompleted(ctx) {
  updateLocalData(ctx);
  await ctx.replyWithHTML(
    'Введите порядковый номер задачи, например <b> "5" </b>,чтобы обновить статус задачи №5'
  );
  userLocalObj.action = 'isCompleted';
}

function yesNoKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Да', 'yes')],
    [Markup.button.callback('Нет', 'no')]
  ]);
}

//Button actions

bot.action(['yes', 'no'], async (ctx) => {
  await ctx.answerCbQuery();
  if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'addTask') {
    userLocalObj.groups[userLocalObj.activeGroup].tasks.push({ taskName: userLocalObj.text, isCompleted: false });
    await ctx.editMessageText('Ваша задача успешно добавлена');
  } else if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'deleteTask') {
    userLocalObj.groups[userLocalObj.activeGroup].tasks.splice(userLocalObj.id, 1);
    await ctx.editMessageText('Ваша задача успешно удалена');
  } else if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'isCompleted') {
    userLocalObj.groups[userLocalObj.activeGroup].tasks[userLocalObj.taskId].isCompleted = !userLocalObj.list[userLocalObj.activeGroup].tasks[userLocalObj.taskId].isCompleted;
    await ctx.editMessageText('Статус вашей задачи успешно обновлен');
  } else if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'addGroup') {
    userLocalObj.groups.push({ tasks: [], groupName: userLocalObj.text });
    await ctx.editMessageText('Группа успешно добавлена');
  } else if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'deleteGroup') {
    userLocalObj.groups.splice(userLocalObj.groupId, 1);
    await ctx.editMessageText('Группа успешно удалена');
  } else {
    await ctx.deleteMessage();
  }
  updateDataBase(ctx);
  userLocalObj.action = '';
});

bot.action('menu', async (ctx) => {
  try {
    await ctx.deleteMessage();
    await ctx.replyWithHTML('<b>Меню планировщика</b>', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Мои группы 📋', 'myGroups'), Markup.button.callback('Мои задачи 📋', 'myTasks')],
        [Markup.button.callback('Добавить группу ✏️', 'addGroup'), Markup.button.callback('Добавить задачу ✏️', 'addTask')],
        [Markup.button.callback('Удалить группу 🗑️', 'deleteGroup'), Markup.button.callback('Удалить задачу 🗑️', 'deleteTask')],
        [Markup.button.callback('Выбрать группу 📋', 'chooseGroup'), Markup.button.callback('Обновить статус задачи 🔃', 'updateTask')],
      ]
    ));
  } catch (e) {
    console.log(e);
  }
});

bot.action('chooseGroup', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await chooseGroup(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.action('myGroups', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await myGroups(ctx);
    await ctx.replyWithHTML('Меню возврата', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Вернуться в меню 🔙', 'menu')],
      ]
    ));
  } catch (e) {
    console.log(e);
  }
});

bot.action('myTasks', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await myTasks(ctx);
    await ctx.replyWithHTML('Меню возврата', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Вернуться в меню 🔙', 'menu')],
      ]
    ));
  } catch (e) {
    console.log(e);
  }
});

bot.action('addTask', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await addTask(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.action('deleteTask', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await deleteTask(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.action('updateTask', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await isCompleted(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.action('addGroup', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await addGroup(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.action('deleteGroup', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await deleteGroup(ctx);
  } catch (e) {
    console.log(e);
  }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
