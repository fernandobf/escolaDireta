import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import fs from "fs";
import { sseHandler, sendEventToAll } from './routes/events';
import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";
import {
  carregarTokenDoArquivo,
  gerarQRCodeDoDia,
} from "./utils/gerarQRCode";

// 👉 IMPORTA o reset que você já criou
import { resetStudentStatus } from "./scripts/resetStudentStatus";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// SSE para HTMLs
app.get('/events', sseHandler);

// ✅ Endpoint que realmente gera novo QR Code e notifica os clientes
app.post("/api/notify-qrcode-update", async (req, res) => {
  console.log("📩 Requisição manual recebida: Gerando novo QR Code...");
  await gerarQRCodeDoDia();

  sendEventToAll({
    type: "qrcode-updated",
    timestamp: new Date().toISOString(),
  });

  res.status(200).json({ ok: true });
});

// Rotas principais
app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// QR Code atual
app.get("/back-end/qrcode.png", (req, res) => {
  const filePath = path.join(process.cwd(), "qrcode.png");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("QR Code ainda não gerado.");
  }
});

// Carrega token salvo ou gera novo
carregarTokenDoArquivo();

// ✅ Agendamento diário às 07h (segunda a sexta) para gerar QR Code
cron.schedule("0 7 * * 1-5", () => {
  console.log("⏰ Agendamento: gerando QR Code do dia...");
  gerarQRCodeDoDia();
});

// ✅ Agendamento diário à meia-noite para resetar status dos alunos
console.log("🕒 Hora local no servidor:", new Date().toLocaleString());
cron.schedule("0 0 * * *", async () => {
  console.log("♻️ Agendamento: resetando status dos alunos...");
  await resetStudentStatus();
});

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
