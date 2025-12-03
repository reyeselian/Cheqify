// backend/src/jobs/depositReminders.ts
import { DateTime } from "luxon";
import Cheque, { ICheque } from "../models/Cheque";
import { sendMail } from "../services/mailer";
import { dailyDepositsTemplate } from "../services/emailTemplates";

const TZ = "America/Santo_Domingo";

/**
 * Normaliza un nombre de empresa a un slug para variables de entorno:
 * "Super Col. Domba" -> "SUPER_COL_DOMBA"  =>  NOTIFY_SUPER_COL_DOMBA
 */
function slugifyEmpresa(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

/**
 * Ejecuta el recordatorio de depósitos:
 * - Busca cheques con fechaDeposito = mañana (zona horaria RD)
 * - Estado pendiente (acepta "pendiente" y "Pendiente")
 * - No notificados (reminderSent !== true)
 * - Agrupa por nombre de empresa (company o empresa string)
 * - Envía un solo correo por empresa
 */
export async function runDepositReminders() {
  const now = DateTime.now().setZone(TZ);
  const start = now.plus({ days: 1 }).startOf("day").toJSDate();
  const end = now.plus({ days: 1 }).endOf("day").toJSDate();

  // 1️⃣ Buscar cheques pendientes para mañana que no se han notificado
  const cheques = (await Cheque.find({
    estado: { $in: ["pendiente", "Pendiente"] },
    reminderSent: { $ne: true },
    fechaDeposito: { $gte: start, $lte: end },
  })) as (ICheque & { company?: any; empresa?: any })[];

  if (!cheques.length) {
    console.log("[Cheqify] No hay cheques pendientes para mañana.");
    return { found: 0, groups: 0, sent: 0 };
  }

  // 2️⃣ Agrupar por NOMBRE de empresa
  //    - Prioriza `cheque.company` si es string (nuevo esquema)
  //    - Si no, usa `cheque.empresa` (compatibilidad hacia atrás)
  const porEmpresa = new Map<string, ICheque[]>();
  for (const ch of cheques) {
    const nombreEmpresa: string =
      (typeof (ch as any).company === "string" && (ch as any).company) ||
      (typeof (ch as any).empresa === "string" && (ch as any).empresa) ||
      "";

    if (!nombreEmpresa) {
      console.warn(
        `[Cheqify] Cheque ${String((ch as any)._id)} sin nombre de empresa (company/empresa). Saltando...`
      );
      continue;
    }

    if (!porEmpresa.has(nombreEmpresa)) porEmpresa.set(nombreEmpresa, []);
    porEmpresa.get(nombreEmpresa)!.push(ch);
  }

  if (porEmpresa.size === 0) {
    console.log("[Cheqify] No hay grupos válidos por empresa para mañana.");
    return { found: cheques.length, groups: 0, sent: 0 };
  }

  // 3️⃣ Enviar UN correo por empresa (por grupo)
  let sent = 0;
  for (const [companyName, lista] of porEmpresa.entries()) {
    // 3.1 Determinar correo destino:
    //     a) Variable específica por empresa: NOTIFY_<SLUG>
    //     b) FALLBACK_NOTIFY_EMAIL del .env
    const slug = slugifyEmpresa(companyName);
    const specificEnvKey = `NOTIFY_${slug}`;
    const to =
      process.env[specificEnvKey] ||
      process.env.FALLBACK_NOTIFY_EMAIL ||
      "";

    if (!to) {
      console.warn(
        `[Cheqify] Sin correo configurado para "${companyName}". Define ${specificEnvKey} o FALLBACK_NOTIFY_EMAIL. Saltando...`
      );
      continue;
    }

    // 3.2 Construir correo (usa tu template HTML)
    const template = dailyDepositsTemplate({
      companyName,
      depositDate: now.plus({ days: 1 }).toJSDate(),
      cheques: lista.map((c: any) => ({
        numero: c.numero,
        banco: c.banco,
        beneficiario: c.beneficiario,
        monto: c.monto,
        firmadoPor: c.firmadoPor,
      })),
    });

    // 3.3 Enviar correo
    await sendMail({ to, subject: template.subject, html: template.html });

    // 3.4 Marcar cheques del grupo como notificados
    await Cheque.updateMany(
      { _id: { $in: lista.map((c: any) => c._id) } },
      { $set: { reminderSent: true, reminderSentAt: new Date() } }
    );

    sent += 1;
    console.log(
      `[Cheqify] Correo enviado a "${companyName}" (${to}) con ${lista.length} cheque(s).`
    );
  }

  return { found: cheques.length, groups: porEmpresa.size, sent };
}
