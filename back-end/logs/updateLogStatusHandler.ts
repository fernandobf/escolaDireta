import { Request, Response } from "express";
import pool from "../config/db";
import { sendEventToAll } from "../routes/events"; // <= IMPORTANTE

export const updateLogStatusHandler = async (req: Request, res: Response) => {
  const logId = Number(req.params.id);
  const { new_status } = req.body;

  const actionMap: Record<string, number> = {
    "Solicitado": 4,
    "Em progresso": 2,
    "Finalizado": 3,
    "Não iniciado": 1,
  };

  const newActionId = actionMap[new_status];

  if (!newActionId) {
    res.status(400).json({ error: "Status inválido" });
    return;
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

    // 💬 Envia evento para todos conectados
    console.log("Enviando evento SSE:", { type: 'status-update' });

    sendEventToAll({
      type: "status-update",
      logId,
      newStatus: new_status,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao atualizar status do log:", err);
    res.status(500).json({ error: "Erro interno ao atualizar status" });
  }
};
