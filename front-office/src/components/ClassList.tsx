import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

interface CheckoutLog {
  log_id: string;
  log_student_name: string;
  log_student_tutor_name: string;
  log_student_class: string;
  log_status: string;
  log_action_type: string;
  log_timestamp: string;
}

interface LiveCheckoutsProps {
  setOpenOccurrencesCount: (count: number) => void;
  setCurrentClass: (className: string) => void;
}

const POLL_INTERVAL = 5000;
const FINAL_STATUS = "Finalizado";

const LiveCheckouts: React.FC<LiveCheckoutsProps> = ({
  setOpenOccurrencesCount,
  setCurrentClass,
}) => {
  const [searchParams] = useSearchParams();
  const currentClassParam = searchParams.get("name")?.toLowerCase() || "";
  const [logs, setLogs] = useState<CheckoutLog[]>([]);
  const prevLogIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setCurrentClass(currentClassParam);
  }, [currentClassParam, setCurrentClass]);

  const fetchLogs = async () => {
    try {
      // const response = await fetch(`http://localhost:3000/api/logs/class-logs`);
      const response = await fetch(`https://back-end-2vzw.onrender.com/api/logs/class-logs`);
      const data: CheckoutLog[] = await response.json();

      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.log_timestamp).getTime() - new Date(a.log_timestamp).getTime()
        );

        const newLogs = sorted.filter(
          (log) =>
            !prevLogIdsRef.current.has(log.log_id) &&
            log.log_student_class.toLowerCase() === currentClassParam
        );

        prevLogIdsRef.current = new Set(sorted.map((log) => log.log_id));
        setLogs(sorted);

        const openOccurrences = sorted.filter(
          (log) => log.log_status !== FINAL_STATUS
        );
        setOpenOccurrencesCount(openOccurrences.length);
      } else {
        setLogs([]);
        setOpenOccurrencesCount(0);
      }
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      setOpenOccurrencesCount(0);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [currentClassParam]);

  const getRowClass = (log: CheckoutLog) => {
    return log.log_student_class.toLowerCase() === currentClassParam
      ? "bg-yellow-200"
      : "";
  };

  const handleStatusUpdate = async (
    logId: string,
    newStatus: string,
    studentName: string
  ) => {
    const confirmMsg =
      newStatus === "Em progresso"
        ? `Iniciar processo do aluno(a) ${studentName}?`
        : `Concluir processo do aluno(a) ${studentName}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      // const response = await fetch(`http://localhost:3000/api/logs/${logId}/status`, {
      const response = await fetch(`https://back-end-2vzw.onrender.com/api/logs/${logId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        fetchLogs();
      } else {
        console.error("Erro ao atualizar status:", result.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const day = date.toLocaleDateString("pt-BR");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}, às ${hours}h${minutes}min`;
  };

  return (
    <div className="content internal">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Checkouts em andamento</h2>
      </div>

      {logs.length === 0 ? (
        <p className="text-gray-500">Nenhum checkout registrado.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Nome</th>
              <th className="border px-2 py-1">Responsável</th>
              <th className="border px-2 py-1">Turma</th>
              <th className="border px-2 py-1">Data/Hora</th>
              <th className="border px-2 py-1">Ações</th>
            </tr>
          </thead>
          <tbody>
            {logs.filter((log) => log.log_status !== FINAL_STATUS).length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Não há solicitações pendentes
                </td>
              </tr>
            ) : (
              logs
                .filter((log) => log.log_status !== FINAL_STATUS)
                .map((log) => (
                  <tr key={log.log_id} className={getRowClass(log)}>
                    <td className="border px-2 py-1">{log.log_student_name}</td>
                    <td className="border px-2 py-1">{log.log_student_tutor_name}</td>
                    <td className="border px-2 py-1">{log.log_student_class.toUpperCase()}</td>
                    <td className="border px-2 py-1">{formatDate(log.log_timestamp)}</td>
                    <td className="border px-2 py-1">
                      {log.log_status === "Solicitado" ? (
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            handleStatusUpdate(log.log_id, "Em progresso", log.log_student_name)
                          }
                        >
                          Aceitar solicitação
                        </button>
                      ) : (
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            handleStatusUpdate(log.log_id, "Finalizado", log.log_student_name)
                          }
                        >
                          Concluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LiveCheckouts;
