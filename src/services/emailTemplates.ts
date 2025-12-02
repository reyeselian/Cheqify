import { DateTime } from "luxon";

export function dailyDepositsTemplate(params: {
  companyName: string;
  depositDate: Date;
  cheques: Array<{
    numero: string;
    banco: string;
    beneficiario: string;
    monto: number;
    firmadoPor?: string;
  }>;
}) {
  const dateLabel = DateTime.fromJSDate(params.depositDate)
    .setZone("America/Santo_Domingo")
    .toFormat("cccc, dd 'de' LLLL 'de' yyyy");

  const rows = params.cheques
    .map((c) => `
      <tr>
        <td>${c.numero}</td>
        <td>${c.banco}</td>
        <td>${c.beneficiario}</td>
        <td>RD$ ${c.monto.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</td>
        <td>${c.firmadoPor ?? "-"}</td>
      </tr>`)
    .join("");

  return {
    subject: `Recordatorio: depósito para ${dateLabel} (${params.cheques.length} cheque${params.cheques.length > 1 ? "s" : ""})`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#333;">
        <h2>Recordatorio de Depósito</h2>
        <p>Hola <b>${params.companyName}</b>,</p>
        <p>Este es un recordatorio de que <b>mañana (${dateLabel})</b> debe realizar el depósito de los siguientes cheques:</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
          <thead style="background-color:#f5f5f5;">
            <tr>
              <th>No. Cheque</th>
              <th>Banco</th>
              <th>Beneficiario</th>
              <th>Monto</th>
              <th>Firmado por</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:20px;">Si ya realizó el depósito, puede ignorar este mensaje.</p>
        <p style="font-size:12px;color:#777;">Enviado automáticamente por Cheqify.</p>
      </div>`,
  };
}
