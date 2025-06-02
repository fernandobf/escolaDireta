import QRCode from "qrcode";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";

let dailyToken = "";

export function getDailyToken() {
  return dailyToken;
}

export async function gerarQRCodeDoDia() {
  const payload = {
    clientId: "c1",
    type: "loginQR",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
  };

  dailyToken = jwt.sign(payload, process.env.SECRET || "fallback_secret");

  //const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(dailyToken)}`;
  const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(dailyToken)}`;
  console.log("🔗 URL do QR Code:", url);

  const basePath = process.cwd();
  const qrPath = path.join(basePath, "qrcode.png");
  const tokenPath = path.join(basePath, "token.json");

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync(qrPath, qrImageBuffer);
  fs.writeFileSync(tokenPath, JSON.stringify({ token: dailyToken }));

  console.log("✅ QR Code e token salvos na raiz do projeto.");

  // 👇 Importa dinamicamente para evitar circularidade
  const { sendEventToAll } = await import("../routes/events");
  sendEventToAll({
    type: "qrcode-updated",
    timestamp: new Date().toISOString(),
  });
}

export async function carregarTokenDoArquivo() {
  try {
    const tokenPath = path.join(process.cwd(), "token.json");
    const salvo = fs.readFileSync(tokenPath, "utf-8");
    const token = JSON.parse(salvo).token;
    const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;

    jwt.verify(token, process.env.SECRET || "fallback_secret");
    dailyToken = token;
    console.warn("🟡 [QR] URL do token carregado:", url);
    console.log("📦 Token válido carregado do disco.");
  } catch {
    console.warn("⚠️ Token ausente ou inválido. Gerando novo...");
    await gerarQRCodeDoDia();
  }
}
