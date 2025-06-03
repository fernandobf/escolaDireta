// ✅ CORRETO — não retorna nada, apenas manipula res diretamente
import { Request, Response } from "express";
import QRCode from "qrcode";
import { getDailyToken } from "../utils/gerarQRCode";

export async function qrcodeHandler(req: Request, res: Response): Promise<void> {
  const token = getDailyToken();

  if (!token) {
    res.status(503).send("QR Code ainda não gerado.");
    return;
  }

  const baseUrl = process.env.BASE_URL || "https://back-end-2vzw.onrender.com";
  const loginUrl = `${baseUrl}/login?token=${encodeURIComponent(token)}`;

  try {
    const buffer = await QRCode.toBuffer(loginUrl);
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("Erro ao gerar QR:", err);
    res.status(500).send("Erro ao gerar QR Code.");
  }
}
