// back-end/testConnection.ts
import pool from "./config/db";

(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Conexão bem-sucedida:", result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error);
    process.exit(1);
  }
})();
