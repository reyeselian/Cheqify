import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chequesRouter from "./routes/cheques";
import errorHandler from "./middleware/errorHandler";

// Cargar variables del .env
dotenv.config();

const app = express();

// Configuración general
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/cheques", chequesRouter);

// Prueba rápida
app.get("/", (_req, res) => res.send("Servidor Cheqify activo"));

// Middleware de errores
app.use(errorHandler);

// Exportar app
export default app;
