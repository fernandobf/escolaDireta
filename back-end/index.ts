import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";

import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";
import gerarQRCodeDoDia from "./utils/gerarQRCode";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas da API
app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// Gera o QR Code assim que o servidor inicia
gerarQRCodeDoDia();

// Agenda a geração do QR Code todo dia útil às 7h
cron.schedule("0 7 * * 1-5", () => {
  console.log("⏰ Agendamento diário para gerar QR Code...");
  gerarQRCodeDoDia();
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
