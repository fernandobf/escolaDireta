import { Request, Response } from 'express';

let clients: Response[] = [];
let lastEvent: { type: string; timestamp: string } | null = null;

export const sseHandler = (req: Request, res: Response) => {
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
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  clients.push(res);

  req.on('close', () => {
    console.log("❌ Cliente SSE desconectado");
    clients = clients.filter(client => client !== res);
  });
};

export const sendEventToAll = (data: any) => {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  console.log("📤 Enviando evento SSE:", payload);

  // Salva o último evento para futuros clientes
  lastEvent = data;

  clients.forEach(res => {
    res.write(payload);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  });
};
