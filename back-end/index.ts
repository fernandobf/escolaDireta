import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import logsRoutes from "./routes/logs";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rotas da API
app.use("/api", authRoutes);
app.use("/api/logs", logsRoutes);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
