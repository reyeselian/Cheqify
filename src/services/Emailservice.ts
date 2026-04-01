// src/services/emailService.ts
import { Resend } from "resend";

console.log("CLIENT_URL:", process.env.CLIENT_URL);
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL  = "Cheqify <noreply@cheqify.com>";
const CLIENT_URL  = process.env.CLIENT_URL || "http://localhost:5174";

/* =========================================================
   📧 EMAIL DE VERIFICACIÓN
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
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Verifica tu correo</title>
      </head>
      <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

                <!-- LOGO -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <span style="font-size:2rem;font-weight:800;background:linear-gradient(90deg,#0ea5e9,#8b5cf6);-webkit-background-clip:text;color:#0ea5e9;letter-spacing:-1px;">
                      Cheqify
                    </span>
                    <div style="color:#94a3b8;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">
                      Sistema de Gestión de Cheques
                    </div>
                  </td>
                </tr>

                <!-- CARD -->
                <tr>
                  <td style="background:#ffffff;border-radius:20px;padding:40px 44px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

                    <!-- ICONO -->
                    <div style="text-align:center;margin-bottom:24px;">
                      <div style="display:inline-block;background:#ecfeff;border:2px solid #a5f3fc;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:1.8rem;text-align:center;">
                        ✉️
                      </div>
                    </div>

                    <h1 style="margin:0 0 8px;text-align:center;color:#1a1d23;font-size:1.35rem;font-weight:700;">
                      Verifica tu correo electrónico
                    </h1>
                    <p style="margin:0 0 24px;text-align:center;color:#6b7280;font-size:0.9rem;line-height:1.6;">
                      Hola <strong>${empresa}</strong>, gracias por registrarte en Cheqify.<br/>
                      Haz clic en el botón para activar tu cuenta.
                    </p>

                    <!-- BOTÓN -->
                    <div style="text-align:center;margin-bottom:28px;">
                      <a href="${verifyUrl}"
                        style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#ffffff;text-decoration:none;font-weight:700;font-size:0.95rem;padding:14px 36px;border-radius:12px;box-shadow:0 4px 16px rgba(14,165,233,0.35);">
                        ✅ Verificar mi correo
                      </a>
                    </div>

                    <!-- LINK ALTERNATIVO -->
                    <p style="margin:0 0 6px;text-align:center;color:#9ca3af;font-size:0.75rem;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="margin:0 0 28px;text-align:center;">
                      <a href="${verifyUrl}" style="color:#0ea5e9;font-size:0.72rem;word-break:break-all;">${verifyUrl}</a>
                    </p>

                    <!-- DIVIDER -->
                    <div style="height:1px;background:#e8eaed;margin-bottom:20px;"></div>

                    <!-- AVISO EXPIRACIÓN -->
                    <p style="margin:0;text-align:center;color:#9ca3af;font-size:0.75rem;line-height:1.5;">
                      ⏳ Este enlace expira en <strong>24 horas</strong>.<br/>
                      Si no creaste esta cuenta, ignora este mensaje.
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td align="center" style="padding-top:24px;">
                    <p style="margin:0;color:#9ca3af;font-size:0.72rem;">
                      © ${new Date().getFullYear()} Cheqify · República Dominicana<br/>
                      <a href="https://cheqify.com" style="color:#9ca3af;">cheqify.com</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

      </body>
      </html>
    `,
  });
};