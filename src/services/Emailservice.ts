// src/services/Emailservice.ts
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL  = "Cheqify <noreply@cheqify.com>";
const CLIENT_URL  = process.env.CLIENT_URL  || "https://www.cheqify.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "reyeselian@gmail.com";

const PLAN_LABELS: Record<string, string> = {
  trial:   "Plan de Prueba",
  monthly: "Plan Mensual",
  annual:  "Plan Anual",
};

/* =========================================================
   EMAIL DE VERIFICACIÓN
========================================================= */
export const sendVerificationEmail = async (
  toEmail: string,
  empresa: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
  const resend = getResend();

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
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Santo_Domingo",
  }).format(depositDate);

  const totalMonto = cheques.reduce((sum, c) => sum + c.monto, 0);
  const resend = getResend();

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

/* =========================================================
   EMAIL AL ADMIN — nueva solicitud de cambio de plan
========================================================= */
export const sendPlanRequestEmail = async (
  empresa: string,
  email: string,
  planActual: string,
  planSolicitado: string,
): Promise<void> => {
  const resend = getResend();
  const adminUrl = `${CLIENT_URL}/admin/solicitudes`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   ADMIN_EMAIL,
    subject: `🔔 Nueva solicitud de cambio de plan — ${empresa}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"/></head>
      <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <span style="font-size:2rem;font-weight:800;color:#6366f1;letter-spacing:-1px;">Cheqify</span>
                  <div style="color:#94a3b8;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Admin · Solicitud de Plan</div>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border-radius:20px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
                  <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:#eef2ff;border:2px solid #c7d2fe;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:1.8rem;text-align:center;">🔔</div>
                  </div>
                  <h1 style="margin:0 0 8px;text-align:center;color:#1a1d23;font-size:1.25rem;font-weight:700;">Nueva solicitud de cambio de plan</h1>
                  <p style="margin:0 0 28px;text-align:center;color:#6b7280;font-size:0.88rem;">Un usuario quiere cambiar su plan de suscripción.</p>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:0.82rem;font-weight:600;">Empresa</td>
                        <td style="padding:8px 0;color:#0f172a;font-size:0.88rem;font-weight:700;text-align:right;">${empresa}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:0.82rem;font-weight:600;border-top:1px solid #f1f5f9;">Correo</td>
                        <td style="padding:8px 0;color:#6366f1;font-size:0.88rem;font-weight:600;text-align:right;border-top:1px solid #f1f5f9;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:0.82rem;font-weight:600;border-top:1px solid #f1f5f9;">Plan actual</td>
                        <td style="padding:8px 0;color:#0f172a;font-size:0.88rem;text-align:right;border-top:1px solid #f1f5f9;">${PLAN_LABELS[planActual] ?? planActual}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#64748b;font-size:0.82rem;font-weight:600;border-top:1px solid #f1f5f9;">Plan solicitado</td>
                        <td style="padding:8px 0;border-top:1px solid #f1f5f9;text-align:right;">
                          <span style="background:#eef2ff;color:#6366f1;font-weight:700;font-size:0.82rem;padding:3px 12px;border-radius:20px;">${PLAN_LABELS[planSolicitado] ?? planSolicitado}</span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <div style="text-align:center;margin-bottom:20px;">
                    <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-weight:700;font-size:0.9rem;padding:13px 32px;border-radius:12px;box-shadow:0 4px 16px rgba(99,102,241,0.3);">Ver solicitudes en el Admin →</a>
                  </div>
                  <div style="height:1px;background:#e8eaed;margin-bottom:20px;"></div>
                  <p style="margin:0;text-align:center;color:#9ca3af;font-size:0.75rem;">Cheqify Admin · Notificación automática</p>
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
   EMAIL AL USUARIO — confirmación de solicitud recibida
========================================================= */
export const sendPlanRequestConfirmEmail = async (
  toEmail: string,
  empresa: string,
  planSolicitado: string,
): Promise<void> => {
  const resend = getResend();

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   toEmail,
    subject: "✅ Solicitud de cambio de plan recibida — Cheqify",
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"/></head>
      <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <span style="font-size:2rem;font-weight:800;color:#0ea5e9;letter-spacing:-1px;">Cheqify</span>
                  <div style="color:#94a3b8;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Sistema de Gestión de Cheques</div>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border-radius:20px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
                  <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:#ecfdf5;border:2px solid #a7f3d0;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:1.8rem;text-align:center;">✅</div>
                  </div>
                  <h1 style="margin:0 0 8px;text-align:center;color:#1a1d23;font-size:1.25rem;font-weight:700;">Solicitud recibida</h1>
                  <p style="margin:0 0 20px;text-align:center;color:#6b7280;font-size:0.88rem;line-height:1.6;">
                    Hola <strong>${empresa}</strong>, hemos recibido tu solicitud para cambiar al <strong>${PLAN_LABELS[planSolicitado] ?? planSolicitado}</strong>.<br/>
                    Nos pondremos en contacto contigo a la brevedad posible.
                  </p>
                  <div style="background:#f0fdf4;border:1.5px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
                    <p style="margin:0;color:#059669;font-size:0.88rem;font-weight:600;">⏳ Tiempo de respuesta estimado: 24 horas hábiles</p>
                  </div>
                  <div style="height:1px;background:#e8eaed;margin-bottom:20px;"></div>
                  <p style="margin:0;text-align:center;color:#9ca3af;font-size:0.75rem;line-height:1.5;">
                    Si tienes alguna pregunta, responde a este correo.<br/>
                    © ${new Date().getFullYear()} Cheqify · República Dominicana
                  </p>
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
   EMAIL DE RECUPERACIÓN DE CONTRASEÑA
========================================================= */
export const sendPasswordResetEmail = async (
  toEmail: string,
  empresa: string,
  token: string,
): Promise<void> => {
  const resend = getResend();
  const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to:   toEmail,
    subject: "🔐 Recupera tu contraseña — Cheqify",
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
                    <div style="display:inline-block;background:#fef3cd;border:2px solid #fde68a;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:1.8rem;text-align:center;">🔐</div>
                  </div>
                  <h1 style="margin:0 0 8px;text-align:center;color:#1a1d23;font-size:1.35rem;font-weight:700;">Recupera tu contraseña</h1>
                  <p style="margin:0 0 24px;text-align:center;color:#6b7280;font-size:0.9rem;line-height:1.6;">
                    Hola <strong>${empresa}</strong>, recibimos una solicitud para restablecer tu contraseña.<br/>
                    Haz clic en el botón para continuar.
                  </p>
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#c58b2a,#e8c47a);color:#111;text-decoration:none;font-weight:700;font-size:0.95rem;padding:14px 36px;border-radius:12px;box-shadow:0 4px 16px rgba(197,139,42,0.35);">🔑 Restablecer contraseña</a>
                  </div>
                  <p style="margin:0 0 6px;text-align:center;color:#9ca3af;font-size:0.75rem;">Si el botón no funciona, copia y pega este enlace:</p>
                  <p style="margin:0 0 28px;text-align:center;"><a href="${resetUrl}" style="color:#0ea5e9;font-size:0.72rem;word-break:break-all;">${resetUrl}</a></p>
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin-bottom:20px;text-align:center;">
                    <p style="margin:0;color:#dc2626;font-size:0.78rem;font-weight:600;">⏳ Este enlace expira en <strong>1 hora</strong></p>
                  </div>
                  <div style="height:1px;background:#e8eaed;margin-bottom:20px;"></div>
                  <p style="margin:0;text-align:center;color:#9ca3af;font-size:0.75rem;line-height:1.5;">Si no solicitaste este cambio, ignora este mensaje.<br/>Tu contraseña no será modificada.</p>
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