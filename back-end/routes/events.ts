import { Request, Response } from 'express';

let clients: Response[] = [];
let lastEvent: { type: string; timestamp: string } | null = null;

export const sseHandler = (req: Request, res: Response) => {
  console.log("🔌 Cliente SSE conectado");

  // 🧪 Corrige o cabeçalho digitado errado
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 🔁 Ping a cada 25s para manter conexão viva (evita timeout na Render)
  const keepAlive = setInterval(() => {
    res.write(':\n\n'); // comentário vazio (válido no protocolo SSE)
  }, 25000);

  // 🚀 Envia último evento (se houver)
  if (lastEvent) {
    const payload = `data: ${JSON.stringify(lastEvent)}\n\n`;
    res.write(payload);
  }

  // 🔄 Força envio imediato dos headers (muito importante na Render)
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  // 📥 Armazena conexão
  clients.push(res);

  // ❌ Remove cliente quando desconectar
  req.on('close', () => {
    console.log("❌ Cliente SSE desconectado");
    clearInterval(keepAlive);
    clients = clients.filter(client => client !== res);
  });
};

export const sendEventToAll = (data: any) => {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  console.log("📤 Enviando evento SSE:", payload);

  lastEvent = data;

  clients.forEach(res => {
    res.write(payload);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  });
};
