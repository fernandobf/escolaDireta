// utils/gerarQRCode.ts
import QRCode from "qrcode";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";

// Caminho base absoluto para evitar problemas no Render
const basePath = path.resolve();

// Token armazenado em memória
let dailyToken = "";

// Permite acessar o token atual de forma segura
export function getDailyToken(): string {
  return dailyToken;
}

// Permite carregar token previamente salvo (em caso de restart)
export function carregarTokenDoArquivo() {
  try {
    const salvo = fs.readFileSync(path.join(basePath, "token.json"), "utf-8");
    dailyToken = JSON.parse(salvo).token;
    console.log("📦 Token carregado do disco.");
  } catch {
    console.warn("⚠️ Nenhum token salvo encontrado.");
  }
}

// Cria novo token JWT
function gerarTokenQR(): string {
  const payload = {
    clientId: "c1",
    type: "loginQR",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 horas
  };

  return jwt.sign(payload, process.env.SECRET || "fallback_secret");
}

// Gera o QR code e salva o token
export async function gerarQRCodeDoDia() {
  const token = gerarTokenQR();
  dailyToken = token;

  const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
  console.warn("🎯 URL do QR Code:", url);

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync(path.join(basePath, "qrcode.png"), qrImageBuffer);
  fs.writeFileSync(path.join(basePath, "token.json"), JSON.stringify({ token }));

  console.log("✅ QR Code do dia gerado e token salvo.");
}
