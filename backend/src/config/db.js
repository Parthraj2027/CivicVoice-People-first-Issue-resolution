
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

function sanitizeMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return uri;
  }
}

const connectDB = async () => {
  const configuredUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const localFallbackUri = 'mongodb://127.0.0.1:27017/civicvoice';
  const requirePersistentDb = String(process.env.REQUIRE_PERSISTENT_DB || '').toLowerCase() === 'true';

  const candidateUris = configuredUri ? [configuredUri, localFallbackUri] : [localFallbackUri];

  for (const uri of candidateUris) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      process.env.MONGO_URI = uri;
      return { usingMemoryServer: false };
    } catch (err) {
      console.warn(`MongoDB connection failed for ${sanitizeMongoUri(uri)}:`, err.message);
    }
  }

  if (requirePersistentDb) {
    throw new Error('Persistent MongoDB required but no configured MongoDB endpoint is reachable');
  }

  const memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'civicvoice',
    },
  });

  const memoryUri = memoryServer.getUri();
  const conn = await mongoose.connect(memoryUri);
  process.env.MONGO_URI = memoryUri;
  console.log(`MongoDB memory server connected: ${conn.connection.host}`);

  return { usingMemoryServer: true, memoryServer };
};

module.exports = connectDB;
