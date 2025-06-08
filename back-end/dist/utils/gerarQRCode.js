"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyToken = getDailyToken;
exports.gerarQRCodeDoDia = gerarQRCodeDoDia;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Armazenamento em memória do token atual
let dailyToken = "";
/**
 * Retorna o token atualmente válido
 */
function getDailyToken() {
    return dailyToken;
}
/**
 * Gera um novo token JWT para login via QR Code,
 * atualiza o token em memória e envia notificação via SSE
 */
async function gerarQRCodeDoDia() {
    try {
        // Definição do payload do token
        const payload = {
            clientId: "c1",
            type: "loginQR",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expira em 24 horas
        };
        // Usa variáveis de ambiente se existirem — senão, usa valor seguro default
        const secret = process.env.JWT_SECRET || process.env.SECRET || "fallback_secret";
        // Geração do token JWT
        const novoToken = jsonwebtoken_1.default.sign(payload, secret);
        // URL de destino onde o QR Code vai redirecionar
        const frontOfficeURL = process.env.FRONT_OFFICE_URL || "https://front-office-5ifz.onrender.com";
        const loginUrl = `${frontOfficeURL}/login?token=${encodeURIComponent(novoToken)}`;
        console.log("🔗 Novo QR Code aponta para:", loginUrl);
        // Armazena o token atual em memória
        dailyToken = novoToken;
        // Notifica todos os clientes conectados via SSE
        const { sendEventToAll } = await Promise.resolve().then(() => __importStar(require("../routes/events")));
        sendEventToAll({
            type: "qrcode-updated",
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error("❌ Erro ao gerar QR Code. Token anterior mantido.", err);
    }
}
