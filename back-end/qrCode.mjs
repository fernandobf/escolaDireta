import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import QRCode from 'qrcode';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use('/back-end', express.static(path.join(__dirname, '.')));

// Variável para armazenar o token do dia
let dailyToken = "";

// Função para gerar o token JWT
function gerarTokenQR() {
  const payload = {
    clientId: 'c1',
    type: 'loginQR',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24h
  };
  return jwt.sign(payload, process.env.SECRET);
}

// Função para gerar e salvar o QR Code
async function gerarQRCodeDoDia() {
  const token = gerarTokenQR();
  dailyToken = token; // Salva o token atual

const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
  console.warn('URL do QR Code gerado:', url);

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync('./qrcode.png', qrImageBuffer);
  console.log('✅ QR Code do dia gerado');
}

// Agendamento diário para rodar às 07h de segunda a sexta
cron.schedule('0 7 * * 1-5', () => {
  console.log('⏰ Executando agendamento de QR Code...');
  gerarQRCodeDoDia();
});

// Executa ao iniciar o servidor
gerarQRCodeDoDia();

// Endpoint para validar o token recebido do frontend
app.post('/api/validate-token', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ valid: false, error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);

    // Apenas o token atual é aceito
    if (token !== dailyToken) {
      return res.status(403).json({ valid: false, error: 'Token inválido ou não autorizado' });
    }

    res.json({ valid: true, clientId: decoded.clientId });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Token expirado ou malformado' });
  }
});

app.listen(3001, () => console.log('✅ Backend rodando na porta 3001'));