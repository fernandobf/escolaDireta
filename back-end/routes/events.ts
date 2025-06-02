import { Request, Response } from 'express';

let clients: Response[] = [];

export const sseHandler = (req: Request, res: Response) => {
  console.log("🔌 Cliente SSE conectado");

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Se o res.flush estiver disponível (por exemplo via helmet ou compression removido)
  if (typeof (res as any).flush === 'function') {
    (res as any).flush(); // força envio imediato dos headers no Express
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

  clients.forEach(res => {
    res.write(payload);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush(); // força envio do buffer imediatamente
    }
  });
};
