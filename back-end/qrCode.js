
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
/*app.use(cors({
  origin: 'http://localhost:5173'  // Permite só o frontend dessa origem
}));*/


// Geração do token JWT
function gerarTokenQR() {
  const payload = {
    clientId: 'c1',
    type: 'loginQR',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
  };
  return jwt.sign(payload, process.env.SECRET);
}

// Geração e salvamento do QR Code
async function gerarQRCodeDoDia() {
  const token = gerarTokenQR();
  const url = `https://front-office-5ifz.onrender.com/login?token=${token}`;
  
  console.warn('URL do QR Code gerado:', url); // <-- aqui o log da URL

  const qrImageBuffer = await QRCode.toBuffer(url);
  fs.writeFileSync('./qrcode.png', qrImageBuffer);
  console.log('✅ QR Code do dia gerado');
}

// Agendamento para rodar às 7h de segunda a sexta
cron.schedule('0 7 * * 1-5', () => {
  console.log('⏰ Executando agendamento de QR Code...');
  gerarQRCodeDoDia();
});

// Executa ao iniciar também
gerarQRCodeDoDia();

// Endpoint para validação do token
app.post('/api/validate-token', (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    res.json({ valid: true, clientId: decoded.clientId });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Token inválido ou expirado' });
  }
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));
