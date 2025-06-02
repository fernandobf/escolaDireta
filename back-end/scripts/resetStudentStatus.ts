import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { sendEventToAll } from '../routes/events'; // ajuste o caminho se necessário

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function resetStudentStatus() {
  console.log("📦 Iniciando arquivamento dos logs...");

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Copia os logs para logs_arquivados
      await client.query(`
        INSERT INTO logs_arquivados (
          log_id,
          log_student_id,
          log_caregiver_id,
          log_module_id,
          log_action_id,
          log_date_time
        )
        SELECT
          log_id,
          log_student_id,
          log_caregiver_id,
          log_module_id,
          log_action_id,
          log_date_time
        FROM logs
      `);

      // 2. Limpa a tabela original
      await client.query("DELETE FROM logs");

      await client.query('COMMIT');

      console.log("✅ Logs arquivados e tabela limpa com sucesso.");

      // 3. 🔔 Envia evento SSE (se clientes estiverem conectados)
      sendEventToAll({
        type: "logs-resetados",
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("❌ Erro ao arquivar/limpar logs:", error);
  }
}

// ✅ Permite rodar manualmente via terminal
if (require.main === module) {
  console.log("🔍 DATABASE_URL usada:", process.env.DATABASE_URL);
  resetStudentStatus()
    .then(() => {
      console.log("✔️ Execução manual finalizada.");
      return pool.end(); // ⚠️ Fecha o pool só ao rodar diretamente
    })
    .catch((err) => {
      console.error("❌ Erro na execução manual:", err);
      process.exit(1);
    });
}
