import express from "express";
import { sendMail } from "../services/mailer";
import { runDepositReminders } from "../jobs/depositReminders";

const router = express.Router();

// ── Prueba de correo simple ──────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const to = process.env.FALLBACK_NOTIFY_EMAIL || "cheqify.notificaciones@gmail.com";
    await sendMail({
      to,
      subject: "📮 Prueba de correo - Cheqify",
      html: `<h2>Correo de prueba</h2><p>Este es un correo enviado manualmente desde el endpoint /api/test-email</p>`,
    });
    res.json({ ok: true, msg: "Correo de prueba enviado con éxito" });
  } catch (error) {
    console.error("Error enviando correo de prueba:", error);
    res.status(500).json({ ok: false, msg: "Error enviando correo" });
  }
});

// ── Ejecutar job de recordatorios manualmente ────────────────
// GET /api/test-email/reminders
router.get("/reminders", async (req, res) => {
  try {
    console.log("[Cheqify] Ejecutando job de recordatorios manualmente...");
    const result = await runDepositReminders();
    res.json({ ok: true, result });
  } catch (error) {
    console.error("Error ejecutando reminders:", error);
    res.status(500).json({ ok: false, msg: "Error ejecutando job de recordatorios" });
  }
});

export default router;