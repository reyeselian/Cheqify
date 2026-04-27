// src/jobs/depositReminders.ts
import { DateTime } from "luxon";
import Cheque from "../models/Cheque";
import { User } from "../models/User";
import { sendDepositReminderEmail } from "../services/Emailservice";

const TZ = "America/Santo_Domingo";

export async function runDepositReminders() {
  const now    = DateTime.now().setZone(TZ);
  const manana = now.plus({ days: 1 });

  // ✅ Calcular el rango usando la zona horaria local de Santo Domingo
  // Evita el bug donde UTC avanzado hace que "mañana" se calcule mal
  const startLocal = DateTime.fromObject(
    { year: manana.year, month: manana.month, day: manana.day, hour: 0, minute: 0, second: 0 },
    { zone: TZ }
  );
  const endLocal = DateTime.fromObject(
    { year: manana.year, month: manana.month, day: manana.day, hour: 23, minute: 59, second: 59 },
    { zone: TZ }
  );

  const start = startLocal.toUTC().toJSDate();
  const end   = endLocal.toUTC().toJSDate();

  console.log(`[Cheqify] Buscando cheques para el ${manana.toFormat("dd/MM/yyyy")} (hora Santo Domingo)...`);
  console.log(`[Cheqify] Rango UTC: ${start.toISOString()} → ${end.toISOString()}`);

  const cheques = await Cheque.find({
    estado:        { $in: ["pendiente", "Pendiente"] },
    reminderSent:  { $ne: true },
    fechaDeposito: { $gte: start, $lte: end },
  });

  if (!cheques.length) {
    console.log("[Cheqify] No hay cheques pendientes para mañana.");
    return { found: 0, groups: 0, sent: 0 };
  }

  console.log(`[Cheqify] ${cheques.length} cheque(s) encontrado(s).`);

  const porUsuario = new Map<string, typeof cheques>();
  for (const ch of cheques) {
    const userId = ch.usuario.toString();
    if (!porUsuario.has(userId)) porUsuario.set(userId, []);
    porUsuario.get(userId)!.push(ch);
  }

  let sent = 0;

  for (const [userId, lista] of porUsuario.entries()) {
    try {
      const usuario = await User.findById(userId).select("email empresa status");

      if (!usuario) {
        console.warn(`[Cheqify] Usuario ${userId} no encontrado.`);
        continue;
      }

      if (["blocked", "trial_expired", "payment_required"].includes(usuario.status)) {
        console.log(`[Cheqify] Usuario ${usuario.email} omitido (status: ${usuario.status}).`);
        continue;
      }

      const depositDate = lista[0].fechaDeposito!;

      await sendDepositReminderEmail(
        usuario.email,
        usuario.empresa,
        depositDate,
        lista.map((c) => ({
          numero:       c.numero,
          banco:        c.banco,
          beneficiario: c.beneficiario,
          monto:        c.monto,
          firmadoPor:   c.firmadoPor,
        }))
      );

      await Cheque.updateMany(
        { _id: { $in: lista.map((c) => c._id) } },
        { $set: { reminderSent: true, reminderSentAt: new Date() } }
      );

      sent += 1;
      console.log(`[Cheqify] ✅ Recordatorio enviado a ${usuario.email} (${lista.length} cheque(s)).`);

    } catch (err) {
      console.error(`[Cheqify] ❌ Error enviando recordatorio al usuario ${userId}:`, err);
    }
  }

  console.log(`[Cheqify] Completado. Enviados: ${sent}/${porUsuario.size}`);
  return { found: cheques.length, groups: porUsuario.size, sent };
}