import { Request, Response } from "express";
import pool from "../config/db";

export async function getCurrentLogs(req: Request, res: Response) {
  try {
const result = await pool.query(`
  SELECT DISTINCT ON (s.student_id)
    s.student_id,
    s.student_name_official AS student_name,
    sp.spot_name_official AS spot_name,
    a.action_name AS log_status,
    l.log_date_time AS log_timestamp
  FROM logs l
  JOIN students s ON l.log_student_id = s.student_id
  JOIN spots sp ON s.spot_id = sp.spot_id
  JOIN module_actions a ON l.log_action_id = a.action_id
  ORDER BY s.student_id, l.log_date_time DESC
`);


    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    res.status(500).json({ error: "Erro ao buscar logs." });
  }
}
