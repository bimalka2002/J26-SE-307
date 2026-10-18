import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Isolated disposable database; never reads the development .env or database.
// Prefer MONGODB_MEMORY_SERVER / downloaded binary so tests work without a local mongod.
export async function startMongo(_port) {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("oralscan_test");

  async function stop() {
    await mongoose.disconnect().catch(() => {});
    await mongod.stop();
  }

  try {
    await mongoose.connect(uri);
  } catch (error) {
    await stop();
    throw error;
  }
  return stop;
}
