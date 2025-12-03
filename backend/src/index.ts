import dotenv from "dotenv";
dotenv.config();
import app from "./server";
import connectDB from "./config/db";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
});
