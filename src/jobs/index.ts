import cron from "node-cron";
import { runDepositReminders } from "./depositReminders";

// Ejecutar todos los días a las 8:00 AM hora RD
cron.schedule("0 8 * * *", async () => {
  try {
    await runDepositReminders();
  } catch (err) {
    console.error("Error en el cron:", err);
  }
}, { timezone: "America/Santo_Domingo" });
