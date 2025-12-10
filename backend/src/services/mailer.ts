import axios from "axios";

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN; // API Token de Mailtrap
  const from = process.env.MAIL_FROM || "Cheqify <cheqify.notificaciones@gmail.com>";

  try {
    const response = await axios.post(
      "https://send.api.mailtrap.io/api/send",
      {
        from: {
          email: from.match(/<(.*)>/)?.[1] || "cheqify.notificaciones@gmail.com",
          name: from.split("<")[0].trim(),
        },
        to: [{ email: to }],
        subject,
        html,
      },
      {
        headers: {
          "Api-Token": MAILTRAP_TOKEN!,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error enviando correo vía Mailtrap API:", error.response?.data || error.message);
    throw new Error("No se pudo enviar el correo.");
  }
}
