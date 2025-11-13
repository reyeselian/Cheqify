import { Router } from "express";
import { runDepositReminders } from "../jobs/depositReminders";

const router = Router();

/**
 * 🧪 Prueba manual de recordatorios de depósito
 * Ejecuta el mismo proceso que el cron diario, pero manualmente.
 * Ideal para probar el envío de correos y verificar formato.
 */
router.post("/test-reminder", async (req, res) => {
  try {
    const result = await runDepositReminders();
    res.json({
      ok: true,
      message: "Recordatorios ejecutados manualmente.",
      result,
    });
  } catch (error: any) {
    console.error("[Cheqify] Error en test-reminder:", error);
    res.status(500).json({
      ok: false,
      message: "Error al enviar recordatorios manuales.",
      error: error.message,
    });
  }
});

export default router;
