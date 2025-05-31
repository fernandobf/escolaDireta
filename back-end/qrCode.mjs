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

let dailyToken = "";

// Tenta carregar token salvo no disco ao iniciar
function carregarTokenDoArquivo() {
  try {
    const salvo = fs.readFileSync(path.join(__dirname, 'token.json'), 'utf-8');
    dailyToken = JSON.parse(salvo).token;
    console.log('📦 Token carregado do disco.');
  } catch (err) {
    console.warn('⚠️ Nenhum token salvo encontrado. Será gerado um novo.');
  }
}

// Gera novo token JWT
function gerarTokenQR() {
  const payload = {
    clientId: 'c1',
    type: 'loginQR',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
  };
  return jwt.sign(payload, process.env.SECRET);
}

// Gera o QRCode e salva o token em disco
async function gerarQRCodeDoDia() {
  const token = gerarTokenQR();
  dailyToken = token;

  const url = `https://front-office-5ifz.onrender.com/login?token=${encodeURIComponent(token)}`;
  console.warn('🧾 URL do QR Code:', url);

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync(path.join(__dirname, 'qrcode.png'), qrImageBuffer);
  fs.writeFileSync(path.join(__dirname, 'token.json'), JSON.stringify({ token }));
  console.log('✅ QR Code gerado e token salvo.');
}

// Agendamento diário
cron.schedule('0 7 * * 1-5', () => {
  console.log('⏰ Gerando QR Code agendado...');
  gerarQRCodeDoDia();
});

// Gera na primeira execução
carregarTokenDoArquivo();
gerarQRCodeDoDia();

// Valida token
app.post('/api/validate-token', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ valid: false, error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);

    if (token !== dailyToken) {
      return res.status(403).json({ valid: false, error: 'Token inválido ou desatualizado' });
    }

    res.json({ valid: true, clientId: decoded.clientId });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Token expirado ou malformado' });
  }
});

app.listen(3001, () => console.log('🚀 Backend rodando na porta 3001'));
