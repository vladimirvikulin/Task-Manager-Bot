'use strict';
const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.DB_TOKEN;
const client = new MongoClient(url);

async function connectDatabase() {
  await client.connect()
    .then(() => console.log('Connected to DB'))
    .catch((e) => console.log(e));
}

class Collection {
  constructor(name) {
    this.collection = client.db().collection(name);
  }

  findOne(obj) {
    return this.collection.findOne(obj);
  }

  create(obj) {
    return this.collection.insertOne(obj);
  }

  update(obj, update) {
    return this.collection.updateOne(obj, update);
  }
}

const users = new Collection('users');

module.exports = { connectDatabase, users };

