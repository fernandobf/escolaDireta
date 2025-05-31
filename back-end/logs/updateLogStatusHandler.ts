import { Request, Response } from "express";
import pool from "../config/db";

export const updateLogStatusHandler = async (req: Request, res: Response) => {
  const logId = Number(req.params.id);
  const { new_status } = req.body;

  const actionMap: Record<string, number> = {
    "Solicitado": 4,
    "Em progresso": 2,
    "Finalizado": 3,
    "Não iniciado": 1, // se quiser permitir reverter
  };

  const newActionId = actionMap[new_status];

  if (!newActionId) {
    res.status(400).json({ error: "Status inválido" });
    return; // Isso evita warnings de 'não terminar a execução'
  }

  try {
    const result = await pool.query(
      "UPDATE logs SET log_action_id = $1 WHERE log_id = $2",
      [newActionId, logId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Log não encontrado" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao atualizar status do log:", err);
    res.status(500).json({ error: "Erro interno ao atualizar status" });
  }
};
