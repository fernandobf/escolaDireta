// index.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import fs from "fs";
import { sseHandler } from './routes/events';

import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";
import {
  carregarTokenDoArquivo,
  gerarQRCodeDoDia,
} from "./utils/gerarQRCode";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
/* app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT"],
  credentials: false
})); */

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use(bodyParser.json());

// Rotas principais
app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);
app.get('/events', sseHandler);

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
// gerarQRCodeDoDia(); // ← isso força a geração sempre

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
