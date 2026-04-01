// src/services/emailService.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Cheqify <notificaciones@cheqify.com>";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5174";

/* =========================================================
   EMAIL DE VERIFICACIÓN
========================================================= */
export const sendVerificationEmail = async (
  toEmail: string,
  empresa: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   toEmail,
    subject: "Verifica tu correo — Cheqify",
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"/></head>
      <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <span style="font-size:2rem;font-weight:800;color:#0ea5e9;letter-spacing:-1px;">Cheqify</span>
                  <div style="color:#94a3b8;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Sistema de Gestión de Cheques</div>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border-radius:20px;padding:40px 44px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
                  <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:#ecfeff;border:2px solid #a5f3fc;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:1.8rem;text-align:center;">✉️</div>
                  </div>
                  <h1 style="margin:0 0 8px;text-align:center;color:#1a1d23;font-size:1.35rem;font-weight:700;">Verifica tu correo electrónico</h1>
                  <p style="margin:0 0 24px;text-align:center;color:#6b7280;font-size:0.9rem;line-height:1.6;">
                    Hola <strong>${empresa}</strong>, gracias por registrarte en Cheqify.<br/>Haz clic en el botón para activar tu cuenta.
                  </p>
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#ffffff;text-decoration:none;font-weight:700;font-size:0.95rem;padding:14px 36px;border-radius:12px;box-shadow:0 4px 16px rgba(14,165,233,0.35);">✅ Verificar mi correo</a>
                  </div>
                  <p style="margin:0 0 6px;text-align:center;color:#9ca3af;font-size:0.75rem;">Si el botón no funciona, copia y pega este enlace:</p>
                  <p style="margin:0 0 28px;text-align:center;"><a href="${verifyUrl}" style="color:#0ea5e9;font-size:0.72rem;word-break:break-all;">${verifyUrl}</a></p>
                  <div style="height:1px;background:#e8eaed;margin-bottom:20px;"></div>
                  <p style="margin:0;text-align:center;color:#9ca3af;font-size:0.75rem;line-height:1.5;">⏳ Este enlace expira en <strong>24 horas</strong>.<br/>Si no creaste esta cuenta, ignora este mensaje.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:24px;">
                  <p style="margin:0;color:#9ca3af;font-size:0.72rem;">© ${new Date().getFullYear()} Cheqify · República Dominicana<br/><a href="https://cheqify.com" style="color:#9ca3af;">cheqify.com</a></p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

/* =========================================================
   EMAIL DE RECORDATORIO DE CHEQUES
========================================================= */
interface ChequeResumen {
  numero: string;
  banco: string;
  beneficiario: string;
  monto: number;
  firmadoPor?: string;
}

export const sendDepositReminderEmail = async (
  toEmail: string,
  empresa: string,
  depositDate: Date,
  cheques: ChequeResumen[]
): Promise<void> => {
  const fechaFormateada = new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
    timeZone: "America/Santo_Domingo",
  }).format(depositDate);

  const totalMonto = cheques.reduce((sum, c) => sum + c.monto, 0);

  const filasHTML = cheques.map((c) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:0.85rem;color:#0f172a;font-weight:600;">#${c.numero}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:0.85rem;color:#475569;">${c.banco}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:0.85rem;color:#475569;">${c.beneficiario}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:0.85rem;color:#059669;font-weight:700;text-align:right;">RD$${c.monto.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:0.82rem;color:#94a3b8;">${c.firmadoPor || "—"}</td>
    </tr>
  `).join("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   toEmail,
    subject: `📅 Recordatorio: ${cheques.length} cheque${cheques.length !== 1 ? "s" : ""} para depositar mañana — Cheqify`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
      <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
          <tr><td align="center">
            <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <span style="font-size:2rem;font-weight:800;color:#0ea5e9;letter-spacing:-1px;">Cheqify</span>
                  <div style="color:#94a3b8;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Sistema de Gestión de Cheques</div>
                </td>
              </tr>

              <tr>
                <td style="background:#ffffff;border-radius:20px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

                  <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:14px;padding:24px;margin-bottom:28px;text-align:center;">
                    <div style="font-size:2.2rem;margin-bottom:8px;">📅</div>
                    <h1 style="margin:0;color:#ffffff;font-size:1.25rem;font-weight:800;">Recordatorio de Depósitos</h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.88rem;">${empresa}</p>
                  </div>

                  <p style="margin:0 0 20px;color:#475569;font-size:0.92rem;line-height:1.6;">
                    Tienes <strong style="color:#0ea5e9;">${cheques.length} cheque${cheques.length !== 1 ? "s" : ""}</strong> programado${cheques.length !== 1 ? "s" : ""} para depositar el día:
                  </p>

                  <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:14px 20px;margin-bottom:24px;text-align:center;">
                    <span style="color:#0369a1;font-weight:700;font-size:1rem;text-transform:capitalize;">📆 ${fechaFormateada}</span>
                  </div>

                  <div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <thead>
                        <tr style="background:#f8fafc;">
                          <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">N° Cheque</th>
                          <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Banco</th>
                          <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Beneficiario</th>
                          <th style="padding:10px 16px;text-align:right;font-size:0.72rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Monto</th>
                          <th style="padding:10px 16px;text-align:left;font-size:0.72rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Firmado por</th>
                        </tr>
                      </thead>
                      <tbody>${filasHTML}</tbody>
                      <tfoot>
                        <tr style="background:#f8fafc;">
                          <td colspan="3" style="padding:12px 16px;font-size:0.85rem;color:#64748b;font-weight:600;">Total a depositar</td>
                          <td style="padding:12px 16px;text-align:right;font-size:1rem;color:#0f172a;font-weight:800;">RD$${totalMonto.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div style="text-align:center;margin-bottom:24px;">
                    <a href="${CLIENT_URL}/cheques" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#ffffff;text-decoration:none;font-weight:700;font-size:0.9rem;padding:13px 32px;border-radius:12px;box-shadow:0 4px 16px rgba(14,165,233,0.3);">Ver cheques en Cheqify →</a>
                  </div>

                  <div style="height:1px;background:#e8eaed;margin-bottom:20px;"></div>
                  <p style="margin:0;text-align:center;color:#9ca3af;font-size:0.75rem;line-height:1.6;">
                    Este es un recordatorio automático de Cheqify.<br/>Si ya realizaste estos depósitos, puedes ignorar este mensaje.
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding-top:24px;">
                  <p style="margin:0;color:#9ca3af;font-size:0.72rem;">© ${new Date().getFullYear()} Cheqify · República Dominicana<br/><a href="https://cheqify.com" style="color:#9ca3af;">cheqify.com</a></p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};