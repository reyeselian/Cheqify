export function dailyDepositsTemplate({
  companyName,
  depositDate,
  cheques,
}: any) {
  const dateStr = new Date(depositDate).toLocaleDateString("es-DO");

  const rows = cheques
    .map(
      (c: any) => `
        <tr>
          <td>${c.numero}</td>
          <td>${c.banco}</td>
          <td>${c.beneficiario}</td>
          <td>RD$ ${c.monto.toLocaleString()}</td>
          <td>${c.firmadoPor || "-"}</td>
        </tr>`
    )
    .join("");

  const html = `
    <h2>Recordatorio de cheques para depósito</h2>
    <p>Empresa: <strong>${companyName}</strong></p>
    <p>Fecha de depósito: <strong>${dateStr}</strong></p>

    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <thead>
        <tr>
          <th>Número</th>
          <th>Banco</th>
          <th>Beneficiario</th>
          <th>Monto</th>
          <th>Firmado por</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  return {
    subject: `📌 Cheques pendientes para depósito (${dateStr})`,
    html,
  };
}
