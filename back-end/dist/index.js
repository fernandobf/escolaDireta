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
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const logs_1 = __importDefault(require("./routes/logs"));
dotenv_1.default.config();
const __dirname = path_1.default.resolve(); // ← substituto compatível com CommonJS
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use("/api", auth_1.default);
app.use("/api/logs", logs_1.default);
// Variável global do token
let dailyToken = "";
// Carrega token do disco (caso exista)
function carregarTokenDoArquivo() {
    try {
        const salvo = fs_1.default.readFileSync(path_1.default.join(__dirname, "token.json"), "utf-8");
        dailyToken = JSON.parse(salvo).token;
        console.log("📦 Token carregado do disco.");
    }
    catch {
        console.warn("⚠️ Nenhum token salvo encontrado.");
    }
}
function gerarTokenQR() {
    const payload = {
        clientId: "c1",
        type: "loginQR",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };
    return jsonwebtoken_1.default.sign(payload, process.env.SECRET || "fallback_secret");
}
async function gerarQRCodeDoDia() {
    const token = gerarTokenQR();
    dailyToken = token;
    const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
    console.log("🔗 URL do QR Code:", url);
    const qrImageBuffer = await qrcode_1.default.toBuffer(url);
    fs_1.default.writeFileSync(path_1.default.join(__dirname, "qrcode.png"), qrImageBuffer);
    fs_1.default.writeFileSync(path_1.default.join(__dirname, "token.json"), JSON.stringify({ token }));
    console.log("✅ QR Code e token gerados.");
}
// Exposição da imagem via rota
app.get("/back-end/qrcode.png", (req, res) => {
    const filePath = path_1.default.join(__dirname, "qrcode.png");
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        res.status(404).send("QR Code ainda não gerado.");
    }
});
// Inicialização
carregarTokenDoArquivo();
gerarQRCodeDoDia();
node_cron_1.default.schedule("0 7 * * 1-5", () => {
    console.log("⏰ Gerando novo QR Code...");
    gerarQRCodeDoDia();
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
