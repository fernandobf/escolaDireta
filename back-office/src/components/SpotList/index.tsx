import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BASE_URL } from '../../config';

interface CheckoutLog {
  log_id: string;
  log_student_id: number;
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

const FINAL_STATUS = "Finalizado";

const LiveCheckouts: React.FC<LiveCheckoutsProps> = ({
  setOpenOccurrencesCount,
  setCurrentClass,
}) => {
  const [searchParams] = useSearchParams();
  const currentClassParam = searchParams.get("name")?.toLowerCase() || "";
  const [logs, setLogs] = useState<CheckoutLog[]>([]);
  const [loadingLogId, setLoadingLogId] = useState<string | null>(null);
  const [filterByCurrentClass, setFilterByCurrentClass] = useState(() => {
    const saved = localStorage.getItem(`live-checkouts-filter:${currentClassParam}`);
    return saved === "true";
  });
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevLogIdsRef = useRef<Set<string>>(new Set());
  const classStudentIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setCurrentClass(currentClassParam);
  }, [currentClassParam, setCurrentClass]);

  useEffect(() => {
    const saved = localStorage.getItem(`live-checkouts-filter:${currentClassParam}`);
    setFilterByCurrentClass(saved === "true");
  }, [currentClassParam]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/logs/class-logs`, {
        cache: "no-store",
      });
      const data: CheckoutLog[] = await response.json();

      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) => new Date(b.log_timestamp).getTime() - new Date(a.log_timestamp).getTime()
        );

        const newIds = new Set(sorted.map((log) => log.log_id));
        const prevIds = prevLogIdsRef.current;
        sorted.forEach((log) => {
          (log as any).isNew = !prevIds.has(log.log_id);
        });

        prevLogIdsRef.current = newIds;
        setLogs(sorted);

        const openOccurrences = sorted.filter(
          (log) => log.log_status !== FINAL_STATUS
        );
        setOpenOccurrencesCount(openOccurrences.length);

        const turmaIds = sorted
          .filter((log) => log.log_student_class.toLowerCase() === currentClassParam)
          .map((log) => log.log_student_id);
        classStudentIdsRef.current = new Set(turmaIds);
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

    const evtSource = new EventSource(`${BASE_URL}/events`);
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const tiposQueAtualizam = ["status-update", "new-checkout-request", "logs-resetados"];

      if (tiposQueAtualizam.includes(data.type)) {
        if (data.type === "new-checkout-request") {
          const requestedStudentIds: number[] = data.students || [];
          const turmaIds = classStudentIdsRef.current;
          const hasMatch = requestedStudentIds.some((id) => turmaIds.has(id));

          if (hasMatch) {
            if (soundEnabled && audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch((err) => console.warn("🔇 Falha ao tocar som:", err));
            }
            if (Notification.permission === "granted") {
              new Notification("🚸 Nova solicitação de retirada!", {
                body: `Nova solicitação para sua turma.`,
                icon: "/icon-192.png",
              });
            }
          }
        }
        fetchLogs();
      }
    };

    evtSource.onerror = (err) => {
      console.warn("[SSE] Conexão SSE falhou:", err);
    };

    return () => {
      evtSource.close();
    };
  }, [currentClassParam, soundEnabled]);

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
      setLoadingLogId(logId);

      const response = await fetch(`${BASE_URL}/api/logs/${logId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_status: newStatus }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error("Erro ao atualizar status:", result.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    } finally {
      setLoadingLogId(null);
    }
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const day = date.toLocaleDateString("pt-BR");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}, às ${hours}h${minutes}min`;
  };

  const activeLogs = logs
    .filter((log) => log.log_status !== FINAL_STATUS)
    .filter((log) =>
      filterByCurrentClass
        ? log.log_student_class.toLowerCase() === currentClassParam
        : true
    );

  return (
    <div className="content internal">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Checkouts em andamento</h2>
      </div>

      <div className="mb-2">
        {!soundEnabled && (
          <button
            className="btn btn-sm bg-blue-500 text-white rounded px-3 py-1"
            onClick={() => {
              audioRef.current = new Audio("/beep.mp3");
              audioRef.current.load();
              setSoundEnabled(true);
            }}
          >
            🔊 Ativar som
          </button>
        )}
      </div>

      <div className="mb-4">
        <button
          onClick={() => {
            setFilterByCurrentClass((prev) => {
              const updated = !prev;
              localStorage.setItem(
                `live-checkouts-filter:${currentClassParam}`,
                String(updated)
              );
              return updated;
            });
          }}
          className={`btn px-4 py-2 rounded transition-colors duration-300 ${
            filterByCurrentClass
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-white border border-gray-400 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-2">
            {filterByCurrentClass
              ? "🔓 Ver todos os checkouts"
              : `🔒 Filtrar: ${currentClassParam.toUpperCase()}`}
          </span>
        </button>
      </div>

      {activeLogs.length === 0 ? (
        <p className="text-gray-500">Nenhum checkout registrado.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-gray-300">
              <th className="border px-2 py-1">Nome</th>
              <th className="border px-2 py-1">Responsável</th>
              <th className="border px-2 py-1">Turma</th>
              <th className="border px-2 py-1">Data/Hora</th>
              <th className="border px-2 py-1">Ações</th>
            </tr>
          </thead>
          <tbody>
            {activeLogs.map((log) => {
              const isCurrentClass =
                log.log_student_class.toLowerCase() === currentClassParam;
              const isNew = (log as any).isNew;

              return (
                <tr
                  key={log.log_id}
                  className={`transition-all duration-500 ${
                    isCurrentClass ? "bg-yellow-200" : ""
                  } ${isNew ? "animate-fadeIn" : ""}`}
                >
                  <td className="border px-2 py-1">{log.log_student_name}</td>
                  <td className="border px-2 py-1">{log.log_student_tutor_name}</td>
                  <td className="border px-2 py-1">
                    {log.log_student_class.toUpperCase()}
                  </td>
                  <td className="border px-2 py-1">
                    {formatDate(log.log_timestamp)}
                  </td>
                  <td className="border px-2 py-1">
                    {isCurrentClass ? (
                      log.log_status === "Solicitado" ? (
                        <button
                          className="btn btn-primary flex items-center gap-2"
                          onClick={() =>
                            handleStatusUpdate(
                              log.log_id,
                              "Em progresso",
                              log.log_student_name
                            )
                          }
                          disabled={loadingLogId === log.log_id}
                        >
                          {loadingLogId === log.log_id ? "⏳" : "Aceitar / Iniciar"}
                        </button>
                      ) : (
                        <button
                          className="btn btn-success flex items-center gap-2"
                          onClick={() =>
                            handleStatusUpdate(
                              log.log_id,
                              "Finalizado",
                              log.log_student_name
                            )
                          }
                          disabled={loadingLogId === log.log_id}
                        >
                          {loadingLogId === log.log_id ? "⏳" : "Concluir"}
                        </button>
                      )
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default LiveCheckouts;
