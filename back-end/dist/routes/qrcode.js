"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrcodeHandler = qrcodeHandler;
const qrcode_1 = __importDefault(require("qrcode"));
const gerarQRCode_1 = require("../utils/gerarQRCode");
async function qrcodeHandler(req, res) {
    const token = (0, gerarQRCode_1.getDailyToken)();
    if (!token) {
        res.status(503).send("QR Code ainda não gerado.");
        return;
    }
    const loginUrl = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
    try {
        const buffer = await qrcode_1.default.toBuffer(loginUrl);
        res.setHeader("Content-Type", "image/png");
        res.send(buffer);
    }
    catch (err) {
        console.error("Erro ao gerar QR:", err);
        res.status(500).send("Erro ao gerar QR Code.");
    }
}
