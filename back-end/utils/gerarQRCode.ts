import jwt from "jsonwebtoken";

let dailyToken = "";

export function getDailyToken() {
  return dailyToken;
}

export async function gerarQRCodeDoDia(): Promise<void> {
  try {
    const payload = {
      clientId: "c1",
      type: "loginQR",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    };

    const secret = process.env.SECRET || "fallback_secret";
    const novoToken = jwt.sign(payload, secret);

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const loginUrl = `${baseUrl}/login?token=${encodeURIComponent(novoToken)}`;

    console.log("🔗 Novo QR Code:", loginUrl);

    // Atualiza o token só se tudo deu certo até aqui
    dailyToken = novoToken;

    // Notifica via SSE
    const { sendEventToAll } = await import("../routes/events");
    sendEventToAll({
      type: "qrcode-updated",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Erro ao gerar QR Code. Token anterior mantido.", err);
  }
}
