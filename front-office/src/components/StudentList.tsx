import { useState, useEffect } from "react";
import { flushSync } from "react-dom";

interface Aluno {
  student_id: number;
  student_name: string;
  spot_name: string;
  caregiver_name: string;
}

interface LogEntry {
  student_id: number;
  log_status: string;
  log_timestamp: string;
}

function StudentList() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [btnTxt, setBtnTxt] = useState("Solicitar Checkout");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchCurrentLogs = async () => {
    try {
      const res = await fetch("https://back-end-2vzw.onrender.com/api/logs/current");
      const data = await res.json();

      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        console.error("Resposta inesperada dos logs:", data);
        setLogs([]);
      }
    } catch (err) {
      console.error("Erro ao buscar logs:", err);
      setLogs([]);
    }
  };

  useEffect(() => {
    const storedAlunos = localStorage.getItem("alunos");
    if (storedAlunos) {
      setAlunos(JSON.parse(storedAlunos));
    }

    fetchCurrentLogs();

    const evtSource = new EventSource("https://back-end-2vzw.onrender.com/events");
    console.log("Conectado ao SSE");

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (
        data.type === "status-update" ||
        data.type === "new-checkout-request"
      ) {
        console.log("[SSE] Atualização recebida:", data);
        fetchCurrentLogs();
      }
    };

    evtSource.onerror = (err) => {
      console.warn("[SSE] Erro na conexão:", err);
      evtSource.close();
    };

    return () => {
      evtSource.close();
    };
  }, []);

  const getStatusForStudent = (id: number): string | null => {
    const entry = logs.find((log) => log.student_id === id);
    return entry?.log_status ?? null;
  };

  const isStudentSelectable = (id: number): boolean => {
    const status = getStatusForStudent(id);
    return status === null || status === "Não iniciado";
  };

  const handleSelectAll = () => {
    const selectable = alunos
      .filter((a) => isStudentSelectable(a.student_id))
      .map((a) => a.student_id);

    if (selectedStudents.size === selectable.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(selectable));
    }
  };

  const handleSelectIndividual = (id: number) => {
    if (!isStudentSelectable(id)) return;
    const updated = new Set(selectedStudents);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setSelectedStudents(updated);
  };

  const handleCheckout = async () => {
    flushSync(() => setBtnTxt("Aguarde..."));

    const caregiver = JSON.parse(localStorage.getItem("responsavel") || "{}");
    const payload = {
      caregiver_id: caregiver.id,
      students: Array.from(selectedStudents),
    };

    try {
      const res = await fetch("https://back-end-2vzw.onrender.com/api/logs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro no envio");

      alert("Solicitação enviada com sucesso!");
      setSelectedStudents(new Set());

      // Sem necessidade de chamar fetchCurrentLogs aqui
      // pois o evento SSE será emitido automaticamente
    } catch (err) {
      alert("Erro ao solicitar checkout.");
      console.error(err);
    } finally {
      setBtnTxt("Solicitar Checkout");
    }
  };

  const isCheckoutAllowed = alunos.some(
    (a) => isStudentSelectable(a.student_id) && selectedStudents.has(a.student_id)
  );

  return (
    <div className="content internal">
      {alunos[0] && (
        <h2>
          Olá, <b>{alunos[0].caregiver_name}</b>
        </h2>
      )}

      <h3>Aluno(s):</h3>

      {alunos.length > 1 && (
        <button onClick={handleSelectAll} className="btn-list">
          {selectedStudents.size === alunos.filter(a => isStudentSelectable(a.student_id)).length
            ? "Desmarcar Todos"
            : "Marcar Todos"}
        </button>
      )}

      {alunos.map((aluno) => {
        const status = getStatusForStudent(aluno.student_id) || "Não iniciado";
        const isDisabled = !isStudentSelectable(aluno.student_id);

        return (
          <div
            key={`${aluno.student_id}-${getStatusForStudent(aluno.student_id) || 'na'}`}
            onClick={() => handleSelectIndividual(aluno.student_id)}
            className={`btn-box ${selectedStudents.has(aluno.student_id) ? "box-active" : ""} ${isDisabled ? "box-disabled" : ""}`}
            style={{
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
          >
            <p><strong>Nome:</strong> {aluno.student_name}</p>
            <p><strong>Turma:</strong> {aluno.spot_name}</p>
            <p><strong>Status:</strong>{" "}
                <span
                  className="status"
                  style={{
                    color: status === "Não iniciado" ? "#333" : "#fff",
                    backgroundColor:
                      status === "Em progresso"
                        ? "green"
                        : status === "Solicitado"
                        ? "#836d0c"
                        : status === "Finalizado"
                        ? "red"
                        : "inherit",
                  }}
                >
                  &nbsp;{status}&nbsp;
                </span></p>
          </div>
        );
      })}

      <button
        onClick={handleCheckout}
        disabled={!isCheckoutAllowed}
        className="btn-list"
        style={{
          backgroundColor: isCheckoutAllowed ? "#f26729" : "#ccc",
          color: isCheckoutAllowed ? "#000" : "#fff",
          cursor: isCheckoutAllowed ? "pointer" : "not-allowed",
        }}
      >
        {btnTxt}
      </button>
    </div>
  );
}

export default StudentList;
