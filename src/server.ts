// src/server.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chequesRouter from "./routes/cheques";
import errorHandler from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import router from "./routes/authRoutes";
import { verifyPassword } from "./controllers/Auth";
import configRoutes from "./routes/configRoutes";
import "./jobs";
import testEmailRoute from "./routes/testEmail";
import planRoutes from "./routes/planRoutes";
import adminRoutes from "./routes/Admin.routes";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/admin", adminRoutes);
app.use("/api/cheques", chequesRouter);
app.use("/api/auth", authRoutes);
router.post("/verify-password", verifyPassword);
app.use("/api/config", configRoutes);
app.use("/api/test-email", testEmailRoute);
app.use("/api/plans", planRoutes);

// Prueba rápida
app.get("/", (_req, res) => res.send("Servidor Cheqify activo"));

// Middleware de errores
app.use(errorHandler);

export default app;