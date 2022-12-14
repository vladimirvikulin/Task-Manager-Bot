'use strict';
const { MongoClient } = require('mongodb');
require('dotenv').config();
const url = process.env.DB_TOKEN;
const client = new MongoClient(url);
(async function createUsersCollection() {
  const collections = await client.db().listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  if (!collectionNames.includes('users')) {
    await client.db().createCollection('users');
    console.log('Collection created');
    await client.close();
  }
})();

