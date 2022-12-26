'use strict';
// Команды бота
const commands = `
/start - Перезапустить бота
/help - Список комманд
/info - Информация о боте
/menu - Меню планировщика
/myTasks - Посмотреть задачи
/addTask - Добавить задачу
/deleteTask - Удалить задачу
/updateTask - Обновить статус задачи
/chooseGroup - Выбрать активную группу
/myGroups - Посмотреть твои группы
/addGroup - Добавить группу
/deleteGroup - Удалить группу
/date - Посмотреть время
`;

const info = `
Этот бот создан для планировки задач, вы можете создавать группу задач и задачи в ней и с помощью комманд или меню взаимодействовать с задачами. 
Напишите /help, чтобы узнать список комманд.`;

const start = (ctx) => `
Привет ${ctx.message.from.first_name}, этот бот создан для планировки задач.
Напиши команду /help, чтобы узнать команды бота.
`;

const myGroupsEmpty = '<b>Список ваших групп пуст</b>';
const myGroups = '<b>Список ваших групп:</b>\n\n';
const addGroup = 'Напишите группу';
const chooseGroup = 'Введите номер группы, чтобы выбрать активную группу';
const deleteGroup = 'Введите порядковый номер группы, например <b> "5" </b>, чтобы удалить группу №5';
const myTasksEmpty = '<b>Список ваших задач пуст</b>';
const myTasks = '<b>Список ваших задач:</b>\n\n';
const addTask = 'Напишите задачу';
const deleteTask = 'Введите порядковый номер задачи, например <b> "5" </b>,чтобы удалить задачу №5';
const isCompleted = 'Введите порядковый номер задачи, например <b> "5" </b>,чтобы обновить статус задачи №5';
const addGroupFirst = 'Для начала создай группу /addGroup';
const isAddTask = 'Вы действительно хотите добавить задачу:\n\n';
const notNumber = 'Ты написал не цифру, попробуй еще раз';
const noTask = 'Задачи с таким номером нет, попробуй еще раз';
const isTaskDelete = 'Вы действительно хотите удалить задачу №';
const isCompletedSure = 'Вы действительно хотите установить или убрать отметку готовности задачи №';
const isAddGroup = 'Вы действительно хотите добавить группу задач ';
const noGroup = 'Группы с таким номером нет, попробуй еще раз';
const successfullyChooseGroup = 'Вы успешно выбрали активную группу';
const isDeleteGroup = 'Вы действительно хотите удалить группу №';
const unknownCommand = 'Неизвестная команда, напишите /help, чтоб узнать список команд';
const successfullyAddTask = 'Ваша задача успешно добавлена';
const successfullyDeleteTask = 'Ваша задача успешно удалена';
const successfullyIsCompleted = 'Статус вашей задачи успешно обновлен';
const successfullyAddGroup = 'Группа успешно добавлена';
const successfullyDeleteGroup = 'Группа успешно удалена';
module.exports = {
  commands,
  info,
  start,
  myGroupsEmpty,
  myGroups,
  addGroup,
  chooseGroup,
  deleteGroup,
  myTasksEmpty,
  myTasks,
  addTask,
  deleteTask,
  isCompleted,
  addGroupFirst,
  isAddTask,
  notNumber,
  noTask,
  isTaskDelete,
  isCompletedSure,
  isAddGroup,
  noGroup,
  successfullyChooseGroup,
  isDeleteGroup,
  unknownCommand,
  successfullyAddTask,
  successfullyDeleteTask,
  successfullyIsCompleted,
  successfullyAddGroup,
  successfullyDeleteGroup,
};

