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

const __dirname = path.resolve(); // ← substituto compatível com CommonJS

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// Variável global do token
let dailyToken = "";

// Carrega token do disco (caso exista)
function carregarTokenDoArquivo() {
  try {
    const salvo = fs.readFileSync(path.join(__dirname, "token.json"), "utf-8");
    dailyToken = JSON.parse(salvo).token;
    console.log("📦 Token carregado do disco.");
  } catch {
    console.warn("⚠️ Nenhum token salvo encontrado.");
  }
}

function gerarTokenQR(): string {
  const payload = {
    clientId: "c1",
    type: "loginQR",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };
  return jwt.sign(payload, process.env.SECRET || "fallback_secret");
}

async function gerarQRCodeDoDia() {
  const token = gerarTokenQR();
  dailyToken = token;

  const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
  console.log("🔗 URL do QR Code:", url);

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync(path.join(__dirname, "qrcode.png"), qrImageBuffer);
  fs.writeFileSync(path.join(__dirname, "token.json"), JSON.stringify({ token }));

  console.log("✅ QR Code e token gerados.");
}

// Exposição da imagem via rota
app.get("/back-end/qrcode.png", (req, res) => {
  const filePath = path.join(__dirname, "qrcode.png");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("QR Code ainda não gerado.");
  }
});

// Inicialização
carregarTokenDoArquivo();
gerarQRCodeDoDia();

cron.schedule("0 7 * * 1-5", () => {
  console.log("⏰ Gerando novo QR Code...");
  gerarQRCodeDoDia();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
