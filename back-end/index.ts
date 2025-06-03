import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import { sseHandler, sendEventToAll } from './routes/events';
import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";
import {
  gerarQRCodeDoDia
} from "./utils/gerarQRCode";
import { qrcodeHandler } from "./routes/qrcode";
import { resetStudentStatus } from "./scripts/resetStudentStatus";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// SSE para HTMLs
app.get('/events', sseHandler);

// ✅ Endpoint manual para novo QR Code
app.post("/api/notify-qrcode-update", async (req, res) => {
  console.log("📩 Requisição manual recebida: Gerando novo QR Code...");
  await gerarQRCodeDoDia();

  sendEventToAll({
    type: "qrcode-updated",
    timestamp: new Date().toISOString(),
  });

  res.status(200).json({ ok: true });
});

// ✅ Rota de QR dinâmico
app.get("/api/qrcode", qrcodeHandler);

// Rotas principais
app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// ✅ Agendamento diário para QR Code às 07h (dias úteis)
cron.schedule("0 7 * * 1-5", () => {
  console.log("⏰ Agendamento: gerando QR Code do dia...");
  gerarQRCodeDoDia();
});

// ✅ Agendamento diário para resetar status à meia-noite
console.log("🕒 Hora local no servidor:", new Date().toLocaleString());
cron.schedule("0 0 * * *", async () => {
  console.log("♻️ Agendamento: resetando status dos alunos...");
  await resetStudentStatus();
});

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  await gerarQRCodeDoDia(); // ✅ Garante QR Code gerado na partida
});

// Endpoint manual para reset
app.post("/api/admin/reset-logs", async (req, res) => {
  console.log("🧼 Requisição manual para resetar logs...");
  await resetStudentStatus();
  res.status(200).json({ ok: true });
});
