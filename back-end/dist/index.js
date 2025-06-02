"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// back-end/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const events_1 = require("./routes/events"); // 👈
const auth_1 = __importDefault(require("./routes/auth"));
const logs_1 = __importDefault(require("./routes/logs"));
const gerarQRCode_1 = require("./utils/gerarQRCode");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(body_parser_1.default.json());
// SSE para HTMLs
app.get('/events', events_1.sseHandler);
// Endpoint opcional para notificação manual via HTTP
app.post("/api/notify-qrcode-update", (req, res) => {
    console.log("📩 Notificação manual: qrcode atualizado");
    (0, events_1.sendEventToAll)({
        type: "qrcode-updated",
        timestamp: new Date().toISOString(),
    });
    res.status(200).json({ ok: true });
});
// Rotas principais
app.use("/api", auth_1.default);
app.use("/api/logs", logs_1.default);
// Exposição do QR Code
app.get("/back-end/qrcode.png", (req, res) => {
    const filePath = path_1.default.join(process.cwd(), "qrcode.png");
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        res.status(404).send("QR Code ainda não gerado.");
    }
});
// Inicialização segura
(0, gerarQRCode_1.carregarTokenDoArquivo)();
// Agenda QR diário às 07h (seg a sex)
node_cron_1.default.schedule("0 7 * * 1-5", () => {
    console.log("⏰ Agendamento: gerando QR Code do dia...");
    (0, gerarQRCode_1.gerarQRCodeDoDia)();
});
// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
