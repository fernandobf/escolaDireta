// index.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";
import {
  carregarTokenDoArquivo,
  gerarQRCodeDoDia,
} from "./utils/gerarQRCode";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rotas principais
app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// Exposição do QR Code
app.get("/back-end/qrcode.png", (req, res) => {
  const filePath = path.join(process.cwd(), "qrcode.png");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("QR Code ainda não gerado.");
  }
});

// Inicialização segura
carregarTokenDoArquivo(); // já gera novo se necessário

// Agenda QR diário às 07h (seg a sex)
cron.schedule("0 7 * * 1-5", () => {
  console.log("⏰ Agendamento: gerando QR Code do dia...");
  gerarQRCodeDoDia();
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
