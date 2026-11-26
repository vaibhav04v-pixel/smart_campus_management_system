const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Set it in backend/.env.");
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const detail = error.message.replace(
      /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
      "MongoDB connection URI [redacted]"
    );
    throw new Error(`MongoDB connection failed: ${detail}`, { cause: error });
  }
};

module.exports = connectDB;
