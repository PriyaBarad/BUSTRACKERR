const mongoose = require('mongoose');

const uri1 = "mongodb://priyabarad24_db_user:priya123@ac-0qg7vrc-shard-00-00.veoot4x.mongodb.net:27017,ac-0qg7vrc-shard-00-01.veoot4x.mongodb.net:27017,ac-0qg7vrc-shard-00-02.veoot4x.mongodb.net:27017/BusDB?ssl=true&replicaSet=atlas-leorg3-shard-0&authSource=admin&retryWrites=true&w=majority";
const uri2 = "mongodb://savitawali:BusTracking123@ac-js78c3m-shard-00-00.js78c3m.mongodb.net:27017,ac-js78c3m-shard-00-01.js78c3m.mongodb.net:27017,ac-js78c3m-shard-00-02.js78c3m.mongodb.net:27017/BusDB?ssl=true&replicaSet=atlas-qjzw9b-shard-0&authSource=admin&retryWrites=true&w=majority";
// Also try the srv format for Savita's URI:
const uri3 = "mongodb+srv://savitawali:BusTracking123@bustracking.js78c3m.mongodb.net/BusDB";

async function testConnection(name, uri) {
  console.log(`\n--- Testing ${name} ---`);
  try {
    const conn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000
    }).asPromise();
    console.log(`✅ Success for ${name}!`);
    await conn.close();
  } catch (err) {
    console.error(`❌ Fail for ${name}:`, err.message);
  }
}

async function run() {
  await testConnection("Active URI (priyabarad24_db_user)", uri1);
  await testConnection("Savita srv URI", uri3);
  process.exit(0);
}

run();
