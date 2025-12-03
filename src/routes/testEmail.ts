import express from "express";
import { sendMail } from "../services/mailer"; // <-- IMPORT CORRECTO

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 👉 Cambia el correo a donde quieras recibir la prueba
    const to = process.env.FALLBACK_NOTIFY_EMAIL || "cheqify.notificaciones@gmail.com";

    const html = `
      <h2>Correo de prueba</h2>
      <p>Este es un correo enviado manualmente desde el endpoint /api/test-email</p>
    `;

    await sendMail({
      to,
      subject: "📮 Prueba de correo - Cheqify",
      html,
    });

    res.json({ ok: true, msg: "Correo de prueba enviado con éxito" });
  } catch (error) {
    console.error("Error enviando correo de prueba:", error);
    res.status(500).json({ ok: false, msg: "Error enviando correo" });
  }
});

export default router;
