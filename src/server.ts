import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chequesRouter from "./routes/cheques";
import errorHandler from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import router from "./routes/authRoutes";
import { verifyPassword } from "./controllers/Auth";
import configRoutes from "./routes/configRoutes";
import "./jobs"; // esto ejecuta el cron automáticamente
import adminRoutes from "./routes/adminRoutes";

// Cargar variables del .env
dotenv.config();

const app = express();

// Configuración general
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/cheques", chequesRouter);
app.use("/api/auth", authRoutes);
router.post("/verify-password", verifyPassword);
app.use("/api/config", configRoutes);
app.use("/api/admin", adminRoutes);


// Prueba rápida
app.get("/", (_req, res) => res.send("Servidor Cheqify activo"));

// Middleware de errores
app.use(errorHandler);

// Exportar app
export default app;
