"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyToken = void 0;
exports.default = gerarQRCodeDoDia;
// utils/gerarQRCode.ts
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.dailyToken = "";
async function gerarQRCodeDoDia() {
    const payload = {
        clientId: "c1",
        type: "loginQR",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 horas
    };
    exports.dailyToken = jsonwebtoken_1.default.sign(payload, process.env.SECRET);
    const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(exports.dailyToken)}`;
    console.warn("🎯 URL do QR Code:", url);
    const qrImageBuffer = await qrcode_1.default.toBuffer(url);
    fs_1.default.writeFileSync("./qrcode.png", qrImageBuffer);
    console.log("✅ QR Code do dia gerado");
}
