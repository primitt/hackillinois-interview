import mongoose from "mongoose";
import { MongoMemoryServer as mongo_memory_server } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "vitest";

let mongo_server: mongo_memory_server;

beforeAll(async () => {
    mongo_server = await mongo_memory_server.create();
    await mongoose.connect(mongo_server.getUri());

    await Promise.all(
        Object.values(mongoose.models).map((model) => model.init()),
    );
});

afterEach(async () => {
    await Promise.all(
        Object.values(mongoose.connection.collections).map((collection) =>
            collection.deleteMany({}),
        ),
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo_server.stop();
});
