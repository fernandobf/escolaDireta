import jwt from "jsonwebtoken";

// Armazenamento em memória do token
let dailyToken = "";

/**
 * Retorna o token atualmente válido
 */
export function getDailyToken(): string {
  return dailyToken;
}

/**
 * Gera um novo token JWT para login via QR Code,
 * atualiza o token em memória e envia notificação via SSE
 */
export async function gerarQRCodeDoDia(): Promise<void> {
  try {
    // Define o payload do token
    const payload = {
      clientId: "c1",
      type: "loginQR",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expira em 24h
    };

    const secret = "fallback_secret"; // 🔒 Você pode mudar isso para algo mais seguro depois
    const novoToken = jwt.sign(payload, secret);

    // Define o endereço fixo do front-office
    const frontOfficeURL = "https://front-office-5ifz.onrender.com";
    const loginUrl = `${frontOfficeURL}/qrCode?token=${encodeURIComponent(novoToken)}`;

    console.log("🔗 Novo QR Code aponta para:", loginUrl);

    // Atualiza o token atual em memória
    dailyToken = novoToken;

    // Notifica os clientes conectados via SSE
    const { sendEventToAll } = await import("../routes/events");
    sendEventToAll({
      type: "qrcode-updated",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Erro ao gerar QR Code. Token anterior mantido.", err);
  }
}
