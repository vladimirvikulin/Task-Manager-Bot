'use strict';

require('dotenv').config();
const {
  Telegraf,
  Markup,
} = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const { connectDatabase, users } = require('./db.js');
const { myConsts } = require('./consts.js');
const localUsers = {};

//Functions

(async function startBot() {
  await connectDatabase();
  await setCommands();
  await setActions();
  await bot.launch();
  console.log('Bot has successfully started!');
})();

async function updateLocalData(ctx) {
  localUsers[ctx.chat.id] = await users.findOne({ chatId: String(ctx.chat.id) });
}

async function updateDataBase(ctx) {
  await users.update(
    { chatId: String(ctx.chat.id) },
    {
      $set: {
        groups: localUsers[ctx.chat.id].groups,
        activeGroup: localUsers[ctx.chat.id].activeGroup,
      }
    }
  );
}

async function addGroup(ctx) {
  await updateLocalData(ctx);
  await ctx.reply(myConsts.addGroup);
  localUsers[ctx.chat.id].action = 'addGroupAction';
}

async function myGroups(ctx) {
  await updateLocalData(ctx);
  const { groups, activeGroup } = localUsers[ctx.chat.id];
  const groupList = groups.map((group, i) => {
    const active = i === activeGroup ? '🟢' : '';
    return `${i + 1}. ${group.groupName} ${active}`;
  });
  const result = groupList.length === 0 ?
    myConsts.myGroupsEmpty :
    myConsts.myGroups + `${groupList.join('\n')}`;
  await ctx.replyWithHTML(result);
}

async function chooseGroup(ctx) {
  await updateLocalData(ctx);
  await myGroups(ctx);
  await ctx.reply(myConsts.chooseGroup);
  localUsers[ctx.chat.id].action = 'chooseGroupAction';
}

async function addTask(ctx) {
  await updateLocalData(ctx);
  await ctx.reply(myConsts.addTask);
  localUsers[ctx.chat.id].action = 'addTaskAction';
}

async function myTasks(ctx) {
  await updateLocalData(ctx);
  if (localUsers[ctx.chat.id].groups.length === 0) {
    await ctx.reply(myConsts.addGroupFirst);
    return;
  }
  const { tasks } = localUsers[ctx.chat.id].groups[localUsers[ctx.chat.id].activeGroup];
  const taskList = tasks.map((task, i) => {
    const completed = task.isCompleted ? '✅' : '🔴';
    return `${i + 1}. ${task.taskName} ${completed}`;
  });
  const result = taskList.length === 0 ?
    myConsts.myTasksEmpty :
    myConsts.myTasks + `${taskList.join('\n')}`;
  await ctx.replyWithHTML(result);
}

async function deleteGroup(ctx) {
  await updateLocalData(ctx);
  await ctx.replyWithHTML(myConsts.deleteGroup);
  localUsers[ctx.chat.id].action = 'deleteGroupAction';
}

async function deleteTask(ctx) {
  await updateLocalData(ctx);
  await ctx.replyWithHTML(myConsts.deleteTask);
  localUsers[ctx.chat.id].action = 'deleteTaskAction';
}

async function isCompleted(ctx) {
  await updateLocalData(ctx);
  await ctx.replyWithHTML(myConsts.isCompleted);
  localUsers[ctx.chat.id].action = 'isCompletedAction';
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
  localUsers[ctx.chat.id].text = ctx.message.text;
  const { groups, activeGroup, text } = localUsers[ctx.chat.id];
  if (groups.length === 0) {
    await ctx.reply(myConsts.addGroupFirst);
    return;
  } else if (activeGroup + 1 > groups.length) {
    await ctx.reply(myConsts.noChosenGroup);
    return;
  }
  await ctx.replyWithHTML(
    myConsts.isAddTask + `<i>${text}</i>`,
    await yesNoKeyboard()
  );
}

async function deleteTaskAction(ctx) {
  localUsers[ctx.chat.id].taskId = Number(ctx.message.text) - 1;
  const { taskId } = localUsers[ctx.chat.id];
  if (WrongDataTask(ctx)) return;
  await ctx.replyWithHTML(
    myConsts.isTaskDelete + `<i>${taskId + 1}</i>`,
    await yesNoKeyboard()
  );
}

async function isCompletedAction(ctx) {
  localUsers[ctx.chat.id].taskId = Number(ctx.message.text) - 1;
  const { taskId } = localUsers[ctx.chat.id];
  if (WrongDataTask(ctx)) return;
  await ctx.replyWithHTML(
    myConsts.isCompletedSure + `<i>${taskId + 1}</i>`,
    await yesNoKeyboard()
  );
}

function WrongDataTask(ctx) {
  const { groups, activeGroup, taskId } = localUsers[ctx.chat.id];
  if (groups.length === 0) {
    ctx.reply(myConsts.addGroupFirst);
    return true;
  } else if (activeGroup + 1 > groups.length) {
    ctx.reply(myConsts.noChosenGroup);
    return true;
  } else if (Number.isNaN(taskId)) {
    ctx.reply(myConsts.notNumber);
    return true;
  }
  const { tasks } = localUsers[ctx.chat.id].groups[localUsers[ctx.chat.id].activeGroup];
  if (taskId + 1 > tasks.length) {
    ctx.reply(myConsts.noTask);
    return true;
  } else return;
}

async function addGroupAction(ctx) {
  localUsers[ctx.chat.id].text = ctx.message.text;
  await ctx.replyWithHTML(
    myConsts.isAddGroup + `<i>${localUsers[ctx.chat.id].text}</i>`,
    await yesNoKeyboard()
  );
}

async function chooseGroupAction(ctx) {
  localUsers[ctx.chat.id].groupId = Number(ctx.message.text) - 1;
  if (WrongDataGroup(ctx)) return;
  localUsers[ctx.chat.id].activeGroup = Number(ctx.message.text) - 1;
  await ctx.reply(myConsts.successfullyChooseGroup);
  await updateDataBase(ctx);
  await myGroups(ctx);
  await backToMenu(ctx);
}

async function deleteGroupAction(ctx) {
  localUsers[ctx.chat.id].groupId = Number(ctx.message.text) - 1;
  if (WrongDataGroup(ctx)) return;
  await ctx.replyWithHTML(
    myConsts.isDeleteGroup + `<i>${localUsers[ctx.chat.id].groupId + 1}</i>`,
    await yesNoKeyboard()
  );
}

function WrongDataGroup(ctx) {
  const { groups, groupId } = localUsers[ctx.chat.id];
  if (Number.isNaN(groupId)) {
    ctx.reply(myConsts.notNumber);
    return true;
  } else if (groupId + 1 > groups.length) {
    ctx.reply(myConsts.noGroup);
    return true;
  } else return;
}

async function noAction(ctx) {
  await ctx.reply(myConsts.unknownCommand);
}

async function addTaskCheck(ctx) {
  localUsers[ctx.chat.id]
    .groups[localUsers[ctx.chat.id].activeGroup]
    .tasks
    .push({ taskName: localUsers[ctx.chat.id].text, isCompleted: false });
  await ctx.editMessageText(myConsts.successfullyAddTask);
}

async function deleteTaskCheck(ctx) {
  localUsers[ctx.chat.id]
    .groups[localUsers[ctx.chat.id].activeGroup]
    .tasks
    .splice(localUsers[ctx.chat.id].taskId, 1);
  await ctx.editMessageText(myConsts.successfullyDeleteTask);
}

async function isCompletedCheck(ctx) {
  let { isCompleted } = localUsers[ctx.chat.id]
    .groups[localUsers[ctx.chat.id].activeGroup]
    .tasks[localUsers[ctx.chat.id].taskId];
  isCompleted = !isCompleted;
  localUsers[ctx.chat.id]
    .groups[localUsers[ctx.chat.id].activeGroup]
    .tasks[localUsers[ctx.chat.id].taskId]
    .isCompleted = isCompleted;
  await ctx.editMessageText(myConsts.successfullyIsCompleted);
}

async function addGroupCheck(ctx) {
  localUsers[ctx.chat.id]
    .groups
    .push({ tasks: [], groupName: localUsers[ctx.chat.id].text });
  await ctx.editMessageText(myConsts.successfullyAddGroup);
}

async function deleteGroupCheck(ctx) {
  localUsers[ctx.chat.id]
    .groups
    .splice(localUsers[ctx.chat.id].groupId, 1);
  const { groupId, activeGroup } = localUsers[ctx.chat.id];
  if (groupId < activeGroup) localUsers[ctx.chat.id].activeGroup--;
  await ctx.editMessageText(myConsts.successfullyDeleteGroup);
}

const actions = {
  addGroupAction,
  deleteGroupAction,
  chooseGroupAction,
  addTaskAction,
  deleteTaskAction,
  isCompletedAction,
  noAction,
};
const checks = {
  addTaskAction: addTaskCheck,
  deleteTaskAction: deleteTaskCheck,
  isCompletedAction: isCompletedCheck,
  addGroupAction: addGroupCheck,
  deleteGroupAction: deleteGroupCheck,
};

//Commands

async function setCommands() {

  bot.start(async (ctx) => {
    await ctx.reply(`${myConsts.start(ctx)}`);
    const userExists = await users.findOne({ chatId: String(ctx.chat.id) });
    if (userExists === null) {
      users.create({ username: `${ctx.message.from.username}`,
        chatId: `${ctx.chat.id}`,
        activeGroup: 0,
        taskId: 0,
        groupId: 0,
        text: '',
        action: 'noAction',
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
    try {
      await ctx.reply(String(new Date()));
    } catch (e) {
      console.log(e);
    }
  });

  bot.command('info', async (ctx) => {
    try {
      await ctx.reply(myConsts.info);
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
        [Markup.button.callback('Выбрать группу 📋', 'chooseGroup'), Markup.button.callback('Обновить задачу 🔃', 'updateTask')],
      ]
    ));
  });

  bot.on('text', async (ctx) => {
    try {
      await actions[localUsers[ctx.chat.id].action](ctx);
    } catch (e) {
      console.log(e);
    }
  });
}

//Button actions

async function setActions() {

  bot.action(['yes', 'no'], async (ctx) => {
    try {
      await ctx.answerCbQuery();
      if (ctx.callbackQuery.data === 'yes') {
        await checks[localUsers[ctx.chat.id].action](ctx);
      } else await ctx.deleteMessage();
      await backToMenu(ctx);
      await updateDataBase(ctx);
    } catch (e) {
      console.log(e);
    }
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

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
