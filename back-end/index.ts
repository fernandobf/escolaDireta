import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import fs from "fs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import path from "path";

import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// Token do dia
let dailyToken = "";

const basePath = path.resolve(__dirname);

// Gera novo token
function gerarTokenQR(): string {
  const payload = {
    clientId: "c1",
    type: "loginQR",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
  };
  return jwt.sign(payload, process.env.SECRET || "fallback_secret");
}

// Salva token e QR Code
async function gerarQRCodeDoDia() {
  const token = gerarTokenQR();
  dailyToken = token;

  const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
  console.log("🔗 URL do QR Code:", url);

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync(path.join(basePath, "qrcode.png"), qrImageBuffer);
  fs.writeFileSync(path.join(basePath, "token.json"), JSON.stringify({ token }));

  console.log("✅ QR Code e token gerados.");
}

// Tenta carregar o token do disco
function carregarTokenDoArquivo() {
  try {
    const salvo = fs.readFileSync(path.join(basePath, "token.json"), "utf-8");
    const token = JSON.parse(salvo).token;

    // Verifica se o token é válido e ainda não expirou
    jwt.verify(token, process.env.SECRET || "fallback_secret");
    dailyToken = token;
    console.log("📦 Token válido carregado do disco.");
  } catch {
    console.warn("⚠️ Token ausente, expirado ou inválido. Gerando novo...");
    gerarQRCodeDoDia(); // Gera se inválido
  }
}

// Exposição do QR Code
app.get("/back-end/qrcode.png", (req, res) => {
  const filePath = path.join(basePath, "qrcode.png");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("QR Code ainda não gerado.");
  }
});

// Inicialização segura
carregarTokenDoArquivo();

// Agenda: 07h de segunda a sexta
cron.schedule("0 7 * * 1-5", () => {
  console.log("⏰ Agendamento: gerando QR Code do dia...");
  gerarQRCodeDoDia();
});

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
