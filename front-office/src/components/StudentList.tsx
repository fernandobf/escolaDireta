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

  useEffect(() => {
    const storedAlunos = localStorage.getItem("alunos");
    if (storedAlunos) {
      setAlunos(JSON.parse(storedAlunos));
    }

    fetch("https://back-end-2vzw.onrender.com/api/logs/current")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          console.error("Resposta inesperada dos logs:", data);
          setLogs([]);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar logs:", err);
        setLogs([]);
      });
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

      const updatedLogs = await fetch("https://back-end-2vzw.onrender.com/api/logs/current").then((r) => r.json());
      setLogs(updatedLogs);
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
            key={aluno.student_id}
            onClick={() => handleSelectIndividual(aluno.student_id)}
            className={`btn-box ${selectedStudents.has(aluno.student_id) ? "box-active" : ""} ${isDisabled ? "box-disabled" : ""}`}
            style={{
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
            }}
          >
            <p><strong>Nome:</strong> {aluno.student_name}</p>
            <p><strong>Turma:</strong> {aluno.spot_name}</p>
            <p><strong>Status:</strong> {status}</p>
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
