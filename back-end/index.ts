import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";

import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";
import {
  carregarTokenDoArquivo,
  gerarQRCodeDoDia,
} from "./utils/gerarQRCode"; // Importa funções do módulo centralizado

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rotas da API
app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// Caminho absoluto para a raiz (usado na exposição da imagem)
const basePath = path.resolve(__dirname);

// Exposição do QR Code via rota
app.get("/back-end/qrcode.png", (req, res) => {
  const filePath = path.join(basePath, "qrcode.png");
  if (require("fs").existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("QR Code ainda não gerado.");
  }
});

// Inicializa token (do disco ou novo)
carregarTokenDoArquivo();
gerarQRCodeDoDia(); // opcional, pois o carregarTokenDoArquivo já chama se necessário

// Agendamento diário às 07h (segunda a sexta)
cron.schedule("0 7 * * 1-5", () => {
  console.log("⏰ Agendamento: gerando QR Code do dia...");
  gerarQRCodeDoDia();
});

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
