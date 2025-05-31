"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = validateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const gerarQRCode_1 = require("../../utils/gerarQRCode");
async function validateToken(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ valid: false, message: "Token ausente." });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        // Verifica se é igual ao token atual
        if (token !== gerarQRCode_1.dailyToken) {
            res.status(403).json({ valid: false, message: "Token inválido ou desatualizado." });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || process.env.SECRET || "fallback_secret");
        res.json({
            valid: true,
            clientId: decoded.clientId,
        });
    }
    catch (err) {
        res.status(401).json({ valid: false, message: "Token malformado ou expirado." });
    }
}
