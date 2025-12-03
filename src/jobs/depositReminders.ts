// backend/src/jobs/depositReminders.ts
import { DateTime } from "luxon";
import Cheque, { ICheque } from "../models/Cheque";
import { sendMail } from "../services/mailer";
import { dailyDepositsTemplate } from "../templates/dailyDepositsTemplate";  // ✅ FIX

const TZ = "America/Santo_Domingo";

function slugifyEmpresa(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

export async function runDepositReminders() {
  const now = DateTime.now().setZone(TZ);
  const start = now.plus({ days: 1 }).startOf("day").toJSDate();
  const end = now.plus({ days: 1 }).endOf("day").toJSDate();

  const cheques = (await Cheque.find({
    estado: { $in: ["pendiente", "Pendiente"] },
    reminderSent: { $ne: true },
    fechaDeposito: { $gte: start, $lte: end },
  })) as (ICheque & { company?: any; empresa?: any })[];

  if (!cheques.length) {
    console.log("[Cheqify] No hay cheques pendientes para mañana.");
    return { found: 0, groups: 0, sent: 0 };
  }

  const porEmpresa = new Map<string, ICheque[]>();
  for (const ch of cheques) {
    const nombreEmpresa: string =
      (typeof (ch as any).company === "string" && (ch as any).company) ||
      (typeof (ch as any).empresa === "string" && (ch as any).empresa) ||
      "";

    if (!nombreEmpresa) {
      console.warn(
        `[Cheqify] Cheque ${String((ch as any)._id)} sin nombre de empresa.`
      );
      continue;
    }

    if (!porEmpresa.has(nombreEmpresa)) porEmpresa.set(nombreEmpresa, []);
    porEmpresa.get(nombreEmpresa)!.push(ch);
  }

  if (porEmpresa.size === 0) {
    console.log("[Cheqify] No hay grupos válidos para mañana.");
    return { found: cheques.length, groups: 0, sent: 0 };
  }

  let sent = 0;
  for (const [companyName, lista] of porEmpresa.entries()) {
    const slug = slugifyEmpresa(companyName);
    const specificEnvKey = `NOTIFY_${slug}`;

    const to =
      process.env[specificEnvKey] ||
      process.env.FALLBACK_NOTIFY_EMAIL ||
      "";

    if (!to) {
      console.warn(
        `[Cheqify] No hay correo configurado para ${companyName}.`
      );
      continue;
    }

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

    await sendMail({
      to,
      subject: template.subject,
      html: template.html,
    });

    await Cheque.updateMany(
      { _id: { $in: lista.map((c: any) => c._id) } },
      { $set: { reminderSent: true, reminderSentAt: new Date() } }
    );

    sent += 1;
    console.log(`[Cheqify] Correo enviado a ${companyName} → ${to}`);
  }

  return { found: cheques.length, groups: porEmpresa.size, sent };
}
