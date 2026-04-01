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

// ── TEST: ejecutar recordatorio manualmente ──
app.get("/api/test-reminder", async (_req, res) => {
  try {
    const { runDepositReminders } = await import("./jobs/depositReminders");
    const result = await runDepositReminders();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DEBUG: ver qué fechas busca el job ──
app.get("/api/debug-reminder", async (_req, res) => {
  try {
    const { DateTime } = await import("luxon");
    const TZ    = "America/Santo_Domingo";
    const now   = DateTime.now().setZone(TZ);
    const start = now.plus({ days: 1 }).startOf("day").toJSDate();
    const end   = now.plus({ days: 1 }).endOf("day").toJSDate();

    const Cheque = (await import("./models/Cheque")).default;
    const todos  = await Cheque.find({});
    const encontrados = await Cheque.find({
      estado:        { $in: ["pendiente", "Pendiente"] },
      reminderSent:  { $ne: true },
      fechaDeposito: { $gte: start, $lte: end },
    });

    res.json({
      ahora:             now.toISO(),
      buscandoEntre:     { start, end },
      totalCheques:      todos.length,
      chequesEncontrados: encontrados.length,
      todosFechas: todos.map((c: any) => ({
        id:            c._id,
        fechaDeposito: c.fechaDeposito,
        estado:        c.estado,
        reminderSent:  c.reminderSent,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware de errores
app.use(errorHandler);

export default app;