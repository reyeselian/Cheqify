// src/jobs/index.ts
import cron from "node-cron";
import { runDepositReminders } from "./jobs/depositReminders";

// ── Ejecutar todos los días a las 8:00 AM hora República Dominicana (UTC-4) ──
// En UTC sería las 12:00 PM (8 + 4 = 12)
cron.schedule("0 12 * * *", async () => {
  console.log("[Cheqify] ⏰ Ejecutando recordatorio de depósitos (8:00 AM RD)...");
  try {
    const result = await runDepositReminders();
    console.log(`[Cheqify] Resultado: ${JSON.stringify(result)}`);
  } catch (err) {
    console.error("[Cheqify] Error en el job de recordatorios:", err);
  }
}, {
  timezone: "UTC",
});

console.log("[Cheqify] ✅ Job de recordatorios programado para las 8:00 AM (hora RD).");