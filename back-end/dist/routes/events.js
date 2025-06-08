"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEventToAll = exports.sseHandler = void 0;
let clients = [];
let lastEvent = null;
const sseHandler = (req, res) => {
    console.log("🔌 Cliente SSE conectado");
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Envia o último evento imediatamente, se houver
    if (lastEvent) {
        const payload = `data: ${JSON.stringify(lastEvent)}\n\n`;
        res.write(payload);
    }
    // Força flush imediato dos headers (útil em alguns ambientes)
    if (typeof res.flush === 'function') {
        res.flush();
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
    // Salva o último evento para futuros clientes
    lastEvent = data;
    clients.forEach(res => {
        res.write(payload);
        if (typeof res.flush === 'function') {
            res.flush();
        }
    });
};
exports.sendEventToAll = sendEventToAll;
