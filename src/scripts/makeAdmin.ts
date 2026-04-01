import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User";

dotenv.config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("🟢 Conectado a MongoDB");

    const result = await User.updateOne(
      { email: "reyesreyeselianeduardo1@gmail.com" }, // 🔴 CAMBIA ESTO
      { role: "admin" }
    );

    console.log("✅ Usuario actualizado:", result);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

makeAdmin();