// utils/gerarQRCode.ts
import QRCode from "qrcode";
import fs from "fs";
import jwt from "jsonwebtoken";

export let dailyToken = "";

export default async function gerarQRCodeDoDia() {
  const payload = {
    clientId: "c1",
    type: "loginQR",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 horas
  };

  dailyToken = jwt.sign(payload, process.env.SECRET as string);

  const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(dailyToken)}`;
  console.warn("🎯 URL do QR Code:", url);

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync("./qrcode.png", qrImageBuffer);
  console.log("✅ QR Code do dia gerado");
}
