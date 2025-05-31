// controllers/logs/startLog.ts
import { Request, Response, RequestHandler } from "express";
import pool from "../config/db";

export const startLog: RequestHandler = async (req, res) => {
  try {
    const { caregiver_id, students } = req.body;

    const moduleRes = await pool.query(
      `SELECT module_id FROM modules WHERE LOWER(module_name_alias) = 'checkout' LIMIT 1`
    );
    if (moduleRes.rowCount === 0) {
      res.status(500).json({ error: "Módulo 'checkout' não encontrado." });
      return;
    }
    const module_id = moduleRes.rows[0].module_id;

    const actionRes = await pool.query(
      `SELECT action_id FROM module_actions WHERE module_id = $1 AND LOWER(action_name) = 'solicitado' LIMIT 1`,
      [module_id]
    );
    if (actionRes.rowCount === 0) {
      res.status(500).json({ error: "Ação 'solicitado' não encontrada." });
      return;
    }
    const action_id = actionRes.rows[0].action_id;

    const values = students.map((student_id: number) => 
      `(${student_id}, ${caregiver_id}, ${module_id}, ${action_id})`
    ).join(", ");

    await pool.query(`
      INSERT INTO logs (log_student_id, log_caregiver_id, log_module_id, log_action_id)
      VALUES ${values}
    `);

    res.status(200).json({ message: "Logs inseridos com sucesso" });
  } catch (error) {
    console.error("Erro ao inserir log:", error);
    res.status(500).json({ error: "Erro ao inserir log" });
  }
};
