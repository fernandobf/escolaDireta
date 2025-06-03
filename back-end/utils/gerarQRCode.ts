import jwt from "jsonwebtoken";

// Armazenamento em memória do token atual
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
    // Definição do payload do token
    const payload = {
      clientId: "c1",
      type: "loginQR",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expira em 24 horas
    };

    // Usa variáveis de ambiente se existirem — senão, usa valor seguro default
    const secret = process.env.JWT_SECRET || process.env.SECRET || "fallback_secret";

    // Geração do token JWT
    const novoToken = jwt.sign(payload, secret);

    // URL de destino onde o QR Code vai redirecionar
    const frontOfficeURL = process.env.FRONT_OFFICE_URL || "https://front-office-5ifz.onrender.com";
    const loginUrl = `${frontOfficeURL}/login?token=${encodeURIComponent(novoToken)}`;

    console.log("🔗 Novo QR Code aponta para:", loginUrl);

    // Armazena o token atual em memória
    dailyToken = novoToken;

    // Notifica todos os clientes conectados via SSE
    const { sendEventToAll } = await import("../routes/events");
    sendEventToAll({
      type: "qrcode-updated",
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("❌ Erro ao gerar QR Code. Token anterior mantido.", err);
  }
}
