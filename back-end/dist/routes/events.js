"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEventToAll = exports.sseHandler = void 0;
let clients = [];
const sseHandler = (req, res) => {
    console.log("🔌 Cliente SSE conectado");
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Se o res.flush estiver disponível (por exemplo via helmet ou compression removido)
    if (typeof res.flush === 'function') {
        res.flush(); // força envio imediato dos headers no Express
    }
    clients.push(res);
    req.on('close', () => {
        console.log("❌ Cliente SSE desconectado");
        clients = clients.filter(client => client !== res);
    });
};
exports.sseHandler = sseHandler;
const sendEventToAll = (data) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    console.log("📤 Enviando evento SSE:", payload);
    clients.forEach(res => {
        res.write(payload);
        if (typeof res.flush === 'function') {
            res.flush(); // força envio do buffer imediatamente
        }
    });
};
exports.sendEventToAll = sendEventToAll;
