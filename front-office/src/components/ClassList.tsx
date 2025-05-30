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

const LiveCheckouts: React.FC<LiveCheckoutsProps> = ({
  setOpenOccurrencesCount,
  setCurrentClass,
}) => {
  const [searchParams] = useSearchParams();
  const currentClassParam = searchParams.get("name")?.toLowerCase() || "";
  const [logs, setLogs] = useState<CheckoutLog[]>([]);
  const prevLogIdsRef = useRef<Set<string>>(new Set());
  const beepRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Seta a turma atual para o header
    setCurrentClass(currentClassParam);
  }, [currentClassParam, setCurrentClass]);

  useEffect(() => {
    beepRef.current = new Audio(`${import.meta.env.BASE_URL}beep.mp3`);
    beepRef.current.load();
  }, []);

  const playBeep = () => {
    if (beepRef.current) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch((err) => {
        console.warn("Erro ao tocar o som:", err);
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbzXbl0HQ9NfsskL3fxz_-QUeBAyxeh85GblPpPN6aObkqjmu_gadjzb2yJS22CUDTYL/exec?act=class&name=${currentClassParam}`
      );
      const data: CheckoutLog[] = await response.json();

      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.log_timestamp).getTime() - new Date(a.log_timestamp).getTime()
        );

        const prevIds = prevLogIdsRef.current;
        const newLogs = sorted.filter(
          (log) =>
            !prevIds.has(log.log_id) &&
            log.log_student_class.toLowerCase() === currentClassParam
        );

        if (newLogs.length > 0) {
          playBeep();
        }

        prevLogIdsRef.current = new Set(sorted.map((log) => log.log_id));
        setLogs(sorted);

        // Atualiza quantidade de ocorrências abertas
        const openOccurrences = sorted.filter(
          (log) =>
            log.log_student_class.toLowerCase() === currentClassParam &&
            log.log_status !== "Concluído"
        );
        setOpenOccurrencesCount(openOccurrences.length);
      } else {
        console.warn("Resposta inválida:", data);
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
      newStatus === "Em processamento"
        ? `Iniciar processo do aluno(a) ${studentName}?`
        : `Concluir processo do aluno(a) ${studentName}?`;

    if (!window.confirm(confirmMsg)) return;

    const act =
      newStatus === "Em processamento"
        ? "update_status_progress"
        : "update_status_finished";

    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbzXbl0HQ9NfsskL3fxz_-QUeBAyxeh85GblPpPN6aObkqjmu_gadjzb2yJS22CUDTYL/exec?act=${act}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            log_id: logId,
            new_status: newStatus,
          }).toString(),
        }
      );

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
      <h2 className="text-xl font-bold mb-4">Checkouts em andamento</h2>

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
            {logs.filter((log) => log.log_status !== "Concluído").length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Não há solicitações pendentes
                </td>
              </tr>
            ) : (
              logs
                .filter((log) => log.log_status !== "Concluído")
                .map((log) => (
                  <tr key={log.log_id} className={getRowClass(log)}>
                    <td className="border px-2 py-1">{log.log_student_name}</td>
                    <td className="border px-2 py-1">{log.log_student_tutor_name}</td>
                    <td className="border px-2 py-1">{log.log_student_class.toUpperCase()}</td>
                    <td className="border px-2 py-1">{formatDate(log.log_timestamp)}</td>
                    <td className="border px-2 py-1">
                      {log.log_student_class.toLowerCase() == currentClassParam ? (
                        log.log_status === "Iniciado" ? (
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              handleStatusUpdate(log.log_id, "Em processamento", log.log_student_name)
                            }
                          >
                            Aceitar solicitação
                          </button>
                        ) : (
                          <button
                            className="btn btn-success"
                            onClick={() =>
                              handleStatusUpdate(log.log_id, "Concluído", log.log_student_name)
                            }
                          >
                            Concluir
                          </button>
                        )
                      ) : null}
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
