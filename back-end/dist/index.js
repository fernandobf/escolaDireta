"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const events_1 = require("./routes/events");
const auth_1 = __importDefault(require("./routes/auth"));
const logs_1 = __importDefault(require("./routes/logs"));
const gerarQRCode_1 = require("./utils/gerarQRCode");
const qrcode_1 = require("./routes/qrcode");
const resetStudentStatus_1 = require("./scripts/resetStudentStatus");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(body_parser_1.default.json());
// SSE para HTMLs
app.get('/events', events_1.sseHandler);
// ✅ Endpoint manual para novo QR Code
app.post("/api/notify-qrcode-update", async (req, res) => {
    console.log("📩 Requisição manual recebida: Gerando novo QR Code...");
    await (0, gerarQRCode_1.gerarQRCodeDoDia)();
    (0, events_1.sendEventToAll)({
        type: "qrcode-updated",
        timestamp: new Date().toISOString(),
    });
    res.status(200).json({ ok: true });
});
// ✅ Rota de QR dinâmico
app.get("/api/qrcode", qrcode_1.qrcodeHandler);
// Rotas principais
app.use("/api", auth_1.default);
app.use("/api/logs", logs_1.default);
// ✅ Agendamento diário para QR Code às 07h (dias úteis)
node_cron_1.default.schedule("0 7 * * 1-5", () => {
    console.log("⏰ Agendamento: gerando QR Code do dia...");
    (0, gerarQRCode_1.gerarQRCodeDoDia)();
});
// ✅ Agendamento diário para resetar status à meia-noite
console.log("🕒 Hora local no servidor:", new Date().toLocaleString());
node_cron_1.default.schedule("0 0 * * *", async () => {
    console.log("♻️ Agendamento: resetando status dos alunos...");
    await (0, resetStudentStatus_1.resetStudentStatus)();
});
// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    await (0, gerarQRCode_1.gerarQRCodeDoDia)(); // ✅ Garante QR Code gerado na partida
});
// Endpoint manual para reset
app.post("/api/admin/reset-logs", async (req, res) => {
    console.log("🧼 Requisição manual para resetar logs...");
    await (0, resetStudentStatus_1.resetStudentStatus)();
    res.status(200).json({ ok: true });
});
