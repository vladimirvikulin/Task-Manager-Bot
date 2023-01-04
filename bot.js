'use strict';

require('dotenv').config();
const {
  Telegraf,
  Markup,
} = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const { connectDatabase, users } = require('./db.js');
const myConsts = require('./consts');
let objDataBase;
const userLocalObj = {
  groups: [],
  text: '',
  taskId: 0,
  groupId: 0,
  action: '',
  activeGroup: 0,
};

//Functions

(async function startBot() {
  await connectDatabase();
  await setCommands();
  await setActions();
})();

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
  await updateLocalData(ctx);
  await ctx.reply(myConsts.addGroup);
  userLocalObj.action = 'addGroup';
}

async function myGroups(ctx) {
  await updateLocalData(ctx);
  const groups = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(userLocalObj.groups);
    }, 300);
  });
  let groupList = '';
  for (let i = 0; i < groups.length; i++) {
    if (i === userLocalObj.activeGroup) {
      groupList += `${i + 1}. ${groups[i].groupName} 🟢\n`;
    } else {
      groupList += `${i + 1}. ${groups[i].groupName}\n`;
    }
  }
  if (groupList === '') {
    await ctx.replyWithHTML(
      myConsts.myGroupsEmpty
    );
  } else {
    await ctx.replyWithHTML(
      myConsts.myGroups +
      `${groupList}`
    );
  }
}

async function chooseGroup(ctx) {
  await myGroups(ctx);
  await ctx.reply(myConsts.chooseGroup);
  userLocalObj.action = 'chooseGroup';
}

async function addTask(ctx) {
  await updateLocalData(ctx);
  await ctx.reply(myConsts.addTask);
  userLocalObj.action = 'addTask';
}
async function myTasks(ctx) {
  await updateLocalData(ctx);
  if (userLocalObj.groups.length === 0) {
    await ctx.reply(myConsts.addGroupFirst);
    return;
  }
  const tasks = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(userLocalObj.groups[userLocalObj.activeGroup].tasks);
    }, 300);
  });
  let taskList = '';
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].isCompleted)  taskList += `${i + 1}. ${tasks[i].taskName} ✅\n`;
    else taskList += `${i + 1}. ${tasks[i].taskName} 🔴\n`;
  }
  if (taskList === '') {
    await ctx.replyWithHTML(myConsts.myTasksEmpty);
  } else {
    await ctx.replyWithHTML(
      myConsts.myTasks +
      `${taskList}`
    );
  }
}

async function deleteGroup(ctx) {
  await updateLocalData(ctx);
  await ctx.replyWithHTML(myConsts.deleteGroup);
  userLocalObj.action = 'deleteGroup';
}

async function deleteTask(ctx) {
  await updateLocalData(ctx);
  await ctx.replyWithHTML(myConsts.deleteTask);
  userLocalObj.action = 'deleteTask';
}

async function isCompleted(ctx) {
  await updateLocalData(ctx);
  await ctx.replyWithHTML(myConsts.isCompleted);
  userLocalObj.action = 'isCompleted';
}

async function yesNoKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Да', 'yes')],
    [Markup.button.callback('Нет', 'no')]
  ]);
}

async function backToMenu(ctx) {
  await ctx.replyWithHTML('Меню возврата', Markup.inlineKeyboard(
    [
      [Markup.button.callback('Вернуться в меню 🔙', 'menu')],
    ]
  ));
}

async function addTaskAction(ctx) {
  userLocalObj.text = ctx.message.text;
  if (userLocalObj.action === 'addTask') {
    if (userLocalObj.groups.length === 0) {
      await ctx.reply(myConsts.addGroupFirst);
      return;
    } else if (userLocalObj.activeGroup + 1 > userLocalObj.groups.length) {
      await ctx.reply(myConsts.noChosenGroup);
      return;
    }
    await ctx.replyWithHTML(
      myConsts.isAddTask + `<i>${ctx.message.text}</i>`,
      await yesNoKeyboard()
    );
  } else return;
}

async function deleteTaskAction(ctx) {
  if (userLocalObj.action === 'deleteTask') {
    userLocalObj.taskId = Number(ctx.message.text) - 1;
    if (userLocalObj.groups.length === 0) {
      await ctx.reply(myConsts.addGroupFirst);
      return;
    } else if (userLocalObj.activeGroup + 1 > userLocalObj.groups.length) {
      await ctx.reply(myConsts.noChosenGroup);
      return;
    }
    if (Number.isNaN(userLocalObj.taskId)) {
      await ctx.reply(myConsts.notNumber);
      return;
    }
    if (userLocalObj.taskId + 1 > userLocalObj.groups[userLocalObj.activeGroup].tasks.length) {
      await ctx.reply(myConsts.noTask);
      return;
    }
    await ctx.replyWithHTML(
      myConsts.isTaskDelete + `<i>${userLocalObj.taskId + 1}</i>`,
      await yesNoKeyboard()
    );
  } else return;
}

async function isCompletedAction(ctx) {
  if (userLocalObj.action === 'isCompleted') {
    userLocalObj.taskId = Number(ctx.message.text) - 1;
    if (userLocalObj.groups.length === 0) {
      ctx.reply(myConsts.addGroupFirst);
      return;
    } else if (userLocalObj.activeGroup + 1 > userLocalObj.groups.length) {
      ctx.reply(myConsts.noChosenGroup);
      return;
    }
    await ctx.replyWithHTML(
      myConsts.isCompletedSure + `<i>${userLocalObj.taskId + 1}</i>`,
      await yesNoKeyboard()
    );
  } else return;
}

async function addGroupAction(ctx) {
  if (userLocalObj.action === 'addGroup') {
    await ctx.replyWithHTML(
      myConsts.isAddGroup + `<i>${userLocalObj.text}</i>`,
      await yesNoKeyboard()
    );
  } else return;
}

async function chooseGroupAction(ctx) {
  if (userLocalObj.action === 'chooseGroup') {
    userLocalObj.groupId = Number(ctx.message.text) - 1;
    if (Number.isNaN(userLocalObj.groupId)) {
      await ctx.reply(myConsts.notNumber);
      return;
    }
    if (userLocalObj.groupId + 1 > userLocalObj.groups.length) {
      await ctx.reply(myConsts.noGroup);
      return;
    }
    userLocalObj.activeGroup = Number(ctx.message.text) - 1;
    await ctx.reply(myConsts.successfullyChooseGroup);
    await updateDataBase(ctx);
    await myGroups(ctx);
  } else return;
}

async function deleteGroupAction(ctx) {
  if (userLocalObj.action === 'deleteGroup') {
    userLocalObj.groupId = Number(ctx.message.text) - 1;
    if (Number.isNaN(userLocalObj.groupId)) {
      await ctx.reply(myConsts.notNumber);
      return;
    }
    if (userLocalObj.groupId + 1 > userLocalObj.groups.length) {
      await ctx.reply(myConsts.noGroup);
      return;
    }
    await ctx.replyWithHTML(
      myConsts.isDeleteGroup +
      `<i>${userLocalObj.groupId + 1}</i>`,
      await yesNoKeyboard()
    );
  } else return;
}

async function noAction(ctx) {
  if (userLocalObj.action === '') {
    await ctx.reply(myConsts.unknownCommand);
  } else return;
}

async function addTaskCheck(ctx) {
  if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'addTask') {
    userLocalObj.groups[userLocalObj.activeGroup].tasks.push({ taskName: userLocalObj.text, isCompleted: false });
    await ctx.editMessageText(myConsts.successfullyAddTask);
  } else return;
}

async function deleteTaskCheck(ctx) {
  if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'deleteTask') {
    userLocalObj.groups[userLocalObj.activeGroup].tasks.splice(userLocalObj.id, 1);
    await ctx.editMessageText(myConsts.successfullyDeleteTask);
  } else return;
}

async function isCompletedCheck(ctx) {
  if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'isCompleted') {
    let isCompleted = userLocalObj.groups[userLocalObj.activeGroup].tasks[userLocalObj.taskId].isCompleted;
    isCompleted = !isCompleted;
    userLocalObj.groups[userLocalObj.activeGroup].tasks[userLocalObj.taskId].isCompleted = isCompleted;
    await ctx.editMessageText(myConsts.successfullyIsCompleted);
  } else return;
}

async function addGroupCheck(ctx) {
  if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'addGroup') {
    userLocalObj.groups.push({ tasks: [], groupName: userLocalObj.text });
    await ctx.editMessageText(myConsts.successfullyAddGroup);
  } else return;
}

async function deleteGroupCheck(ctx) {
  if (ctx.callbackQuery.data === 'yes' && userLocalObj.action === 'deleteGroup') {
    userLocalObj.groups.splice(userLocalObj.groupId, 1);
    await ctx.editMessageText(myConsts.successfullyDeleteGroup);
  } else return;
}

async function actionNoCheck(ctx) {
  if (ctx.callbackQuery.data === 'no') {
    await ctx.deleteMessage();
  } else return;
}

//Commands

async function setCommands() {

  bot.start(async (ctx) => {
    await ctx.reply(`${myConsts.start(ctx)}`);
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

  bot.command('time', async (ctx) => {
    await ctx.reply(String(new Date()));
  });

  bot.command('info', async (ctx) => {
    ctx.reply(myConsts.info);
  });

  bot.command('menu', async (ctx) => {
    await ctx.replyWithHTML('<b>Меню планировщика</b>', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Мои группы 📋', 'myGroups'), Markup.button.callback('Мои задачи 📋', 'myTasks')],
        [Markup.button.callback('Добавить группу ✏️', 'addGroup'), Markup.button.callback('Добавить задачу ✏️', 'addTask')],
        [Markup.button.callback('Удалить группу 🗑️', 'deleteGroup'), Markup.button.callback('Удалить задачу 🗑️', 'deleteTask')],
        [Markup.button.callback('Выбрать группу 📋', 'chooseGroup'), Markup.button.callback('Обновить задачу 🔃', 'updateTask')],
      ]
    ));
  });

  bot.on('text', async (ctx) => {
    await addTaskAction(ctx);
    await deleteTaskAction(ctx);
    await isCompletedAction(ctx);
    await addGroupAction(ctx);
    await chooseGroupAction(ctx);
    await deleteGroupAction(ctx);
    await noAction(ctx);
  });
}

//Button actions

async function setActions() {

  bot.action(['yes', 'no'], async (ctx) => {
    await ctx.answerCbQuery();
    await addTaskCheck(ctx);
    await deleteTaskCheck(ctx);
    await isCompletedCheck(ctx);
    await addGroupCheck(ctx);
    await deleteGroupCheck(ctx);
    await actionNoCheck(ctx);
    await backToMenu(ctx);
    await updateDataBase(ctx);
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
          [Markup.button.callback('Выбрать группу 📋', 'chooseGroup'), Markup.button.callback('Обновить задачу 🔃', 'updateTask')],
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
      await backToMenu(ctx);
    } catch (e) {
      console.log(e);
    }
  });

  bot.action('myTasks', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await myTasks(ctx);
      await backToMenu(ctx);
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
}

bot.launch().then(() => console.log('Bot has successfully started!'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
