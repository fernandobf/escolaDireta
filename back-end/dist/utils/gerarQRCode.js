"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyToken = getDailyToken;
exports.gerarQRCodeDoDia = gerarQRCodeDoDia;
exports.carregarTokenDoArquivo = carregarTokenDoArquivo;
// utils/gerarQRCode.ts
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const events_1 = require("../routes/events"); // 👈 NOVO
let dailyToken = "";
function getDailyToken() {
    return dailyToken;
}
async function gerarQRCodeDoDia() {
    const payload = {
        clientId: "c1",
        type: "loginQR",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    };
    dailyToken = jsonwebtoken_1.default.sign(payload, process.env.SECRET || "fallback_secret");
    const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(dailyToken)}`;
    console.log("🔗 URL do QR Code:", url);
    const basePath = process.cwd();
    const qrPath = path_1.default.join(basePath, "qrcode.png");
    const tokenPath = path_1.default.join(basePath, "token.json");
    const qrImageBuffer = await qrcode_1.default.toBuffer(url);
    fs_1.default.writeFileSync(qrPath, qrImageBuffer);
    fs_1.default.writeFileSync(tokenPath, JSON.stringify({ token: dailyToken }));
    console.log("✅ QR Code e token salvos na raiz do projeto.");
    // 👇 NOVO: Dispara evento SSE
    (0, events_1.sendEventToAll)({
        type: "qrcode-updated",
        timestamp: new Date().toISOString(),
    });
}
function carregarTokenDoArquivo() {
    try {
        const tokenPath = path_1.default.join(process.cwd(), "token.json");
        const salvo = fs_1.default.readFileSync(tokenPath, "utf-8");
        const token = JSON.parse(salvo).token;
        const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
        jsonwebtoken_1.default.verify(token, process.env.SECRET || "fallback_secret");
        dailyToken = token;
        console.warn("🟡 [QR] URL do token carregado:", url);
        console.log("📦 Token válido carregado do disco.");
    }
    catch {
        console.warn("⚠️ Token ausente ou inválido. Gerando novo...");
        gerarQRCodeDoDia();
    }
}
