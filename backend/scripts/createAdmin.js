const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const createOrUpdateAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD in backend/.env.");
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  let admin = await User.findOne({ email }).select("+password");
  if (admin && admin.role !== "admin") {
    throw new Error("That email already belongs to a non-admin account; choose a different ADMIN_EMAIL.");
  }

  if (!admin) {
    admin = new User({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: "admin" });
  } else {
    admin.name = ADMIN_NAME;
    admin.password = ADMIN_PASSWORD;
  }
  await admin.save();
  console.log(`Administrator account is ready for ${email}. Password was not displayed.`);
};

createOrUpdateAdmin()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
