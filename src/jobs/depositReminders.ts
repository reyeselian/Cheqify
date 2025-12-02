import { DateTime } from "luxon";
import  Cheque  from "../models/Cheque";
import { Company } from "../models/Company";
import { sendMail } from "../services/mailer";
import { dailyDepositsTemplate } from "../services/emailTemplates";

const TZ = "America/Santo_Domingo";

export async function runDepositReminders() {
  const now = DateTime.now().setZone(TZ);
  const start = now.plus({ days: 1 }).startOf("day").toJSDate();
  const end = now.plus({ days: 1 }).endOf("day").toJSDate();

  // 1️⃣ Buscar cheques pendientes para mañana que no se han notificado
  const cheques = await Cheque.find({
    estado: "Pendiente",
    reminderSent: { $ne: true },
    fechaDeposito: { $gte: start, $lte: end },
  }).populate("company");

  if (!cheques.length) {
    console.log("No hay cheques pendientes para mañana.");
    return;
  }

  // 2️⃣ Agrupar por empresa
  const porEmpresa = new Map<string, typeof cheques>();
  for (const ch of cheques) {
    const empresa = (ch as any).company;
    if (!empresa) continue;
    const key = String(empresa._id);
    if (!porEmpresa.has(key)) porEmpresa.set(key, []);
    porEmpresa.get(key)!.push(ch);
  }

  // 3️⃣ Recorrer cada empresa y enviar UN solo correo
  for (const [companyId, lista] of porEmpresa.entries()) {
    const company = await Company.findById(companyId);
    if (!company) continue;

    const to = company.notifyEmail || process.env.FALLBACK_NOTIFY_EMAIL;
    if (!to) continue;

    // Construir correo
    const template = dailyDepositsTemplate({
      companyName: company.name,
      depositDate: now.plus({ days: 1 }).toJSDate(),
      cheques: lista.map((c: any) => ({
        numero: c.numero,
        banco: c.banco,
        beneficiario: c.beneficiario,
        monto: c.monto,
        firmadoPor: c.firmadoPor,
    })),

    });

    // 4️⃣ Enviar correo
    await sendMail({ to, subject: template.subject, html: template.html });

    // 5️⃣ Marcar como enviados
    await Cheque.updateMany(
      { _id: { $in: lista.map((c: { _id: any; }) => c._id) } },
      { $set: { reminderSent: true, reminderSentAt: new Date() } }
    );

    console.log(`Correo enviado a ${company.name} con ${lista.length} cheque(s).`);
  }
}
