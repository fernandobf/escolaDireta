import { useState, useEffect } from "react";
import { flushSync } from "react-dom";

function StudentList() {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<any[]>([]);
  const [btnTxt, setBtnTxt] = useState("Solicitar Checkout");
  const [countdowns, setCountdowns] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const storedAlunos = localStorage.getItem("alunos");
    if (storedAlunos) {
      setAlunos(JSON.parse(storedAlunos));
    }
  }, []);

  const generateStudentId = (aluno: any, index: number) => {
    return aluno.id || `${aluno.student_name}-${aluno.student_class}-${index}`;
  };

  const handleSelectAll = () => {
    const selectableStudents = alunos.filter((aluno) => !isLocked(getLogForStudent(aluno)));
    if (selectedStudents.size === selectableStudents.length) {
      setSelectedStudents(new Set());
    } else {
      const allIds = new Set(
        selectableStudents.map((aluno, index) => generateStudentId(aluno, index))
      );
      setSelectedStudents(allIds);
    }
  };

  const handleSelectIndividual = (aluno: any, index: number) => {
    const newSelectedStudents = new Set(selectedStudents);
    const studentId = generateStudentId(aluno, index);
    if (newSelectedStudents.has(studentId)) {
      newSelectedStudents.delete(studentId);
    } else {
      newSelectedStudents.add(studentId);
    }
    setSelectedStudents(newSelectedStudents);
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzXbl0HQ9NfsskL3fxz_-QUeBAyxeh85GblPpPN6aObkqjmu_gadjzb2yJS22CUDTYL/exec?act=class"
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        // Só atualiza logs se houver mudança real
        const isDifferent =
          data.length !== logs.length ||
          data.some((item: any, i: number) => {
            const log = logs[i];
            return (
              !log ||
              log.log_student_name !== item.log_student_name ||
              log.log_student_class !== item.log_student_class ||
              log.log_timestamp !== item.log_timestamp ||
              log.log_status !== item.log_status
            );
          });

        if (isDifferent) {
          setLogs(data);
        }
      } else {
        console.warn("Resposta inesperada:", data);
      }
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []); // roda só uma vez no mount

  const getLogForStudent = (aluno: any) => {
    return logs.find(
      (log) =>
        log.log_student_name === aluno.student_name &&
        log.log_student_class === aluno.student_class
    );
  };

  const isLocked = (log: any) => {
    if (!log || !log.log_timestamp) return false;
    const logTime = new Date(log.log_timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - logTime.getTime()) / 1000 / 60;
    return (log.log_status === "Iniciado" || log.log_status === "Em processamento") && diffInMinutes < 60;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: { [key: string]: number } = {};
      alunos.forEach((aluno, index) => {
        const log = getLogForStudent(aluno);
        const studentId = generateStudentId(aluno, index);
        if (log && isLocked(log)) {
          const logTime = new Date(log.log_timestamp);
          const now = new Date();
          const diff = 60 * 60 * 1000 - (now.getTime() - logTime.getTime());
          newCountdowns[studentId] = Math.max(0, Math.floor(diff / 1000));
        }
      });

      // Verifica se mudou para evitar atualizações desnecessárias
      const hasChanged =
        Object.keys(newCountdowns).length !== Object.keys(countdowns).length ||
        Object.keys(newCountdowns).some((key) => newCountdowns[key] !== countdowns[key]);

      if (hasChanged) {
        setCountdowns(newCountdowns);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alunos, logs, countdowns]);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCheckout = async () => {
    flushSync(() => setBtnTxt("Aguarde...."));

    if (selectedStudents.size === 0) return;

    const studentsToLog = alunos
      .map((aluno, index) => ({ aluno, index }))
      .filter(({ aluno, index }) => selectedStudents.has(generateStudentId(aluno, index)));

    const url = "https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbzXbl0HQ9NfsskL3fxz_-QUeBAyxeh85GblPpPN6aObkqjmu_gadjzb2yJS22CUDTYL/exec?act=start_process";

    try {
      await Promise.all(
        studentsToLog.map(async ({ aluno }) => {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentName: aluno.student_name,
              tutorName: aluno.student_tutor_name,
              studentClass: aluno.student_class,
            }),
          });

          if (!response.ok) {
            throw new Error(`Erro ao registrar aluno: ${aluno.student_name}`);
          }
        })
      );

      flushSync(() => {
        const updatedSelected = new Set(selectedStudents);
        studentsToLog.forEach(({ aluno, index }) => {
          const id = generateStudentId(aluno, index);
          updatedSelected.delete(id);
        });
        setSelectedStudents(updatedSelected);
      });

      alert("Checkout solicitado com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar checkout:", error);
      alert("Houve um erro ao processar o checkout.");
    } finally {
      setBtnTxt("Solicitar Checkout");
    }
  };

  const isAllSelected =
    selectedStudents.size ===
    alunos.filter((aluno) => !isLocked(getLogForStudent(aluno))).length;

  const allStudentsLocked =
    alunos.length > 0 && alunos.every((aluno) => isLocked(getLogForStudent(aluno)));

  return (
    <div className="content internal">
      <div>
        {alunos[0] && alunos[0].student_tutor_name && (
          <h2>
            Olá, <b>{alunos[0].student_tutor_name}</b>.
          </h2>
        )}
      </div>

      <h3>Aluno(s):</h3>

      {alunos.length > 1 && (
        <button
          className="btn-list"
          onClick={handleSelectAll}
          style={{
            padding: "0.5rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
          }}
        >
          {isAllSelected ? "Desmarcar Todos" : "Marcar Todos"}
        </button>
      )}

      {alunos.length > 0 ? (
        alunos.map((aluno, index) => {
          const studentId = generateStudentId(aluno, index);
          const log = getLogForStudent(aluno);
          const status = log?.log_status || "Não iniciado";
          const locked = isLocked(log);
          const isCompleted = status === "Concluído";
          const disabled = locked || isCompleted;

          return (
            <div
              key={`${studentId}-${getLogForStudent(aluno)?.log_status || 'na'}`}
              className={`btn-box ${selectedStudents.has(studentId) ? "box-active" : ""}`}
              style={{
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.45 : 1,
              }}
              onClick={() => !disabled && handleSelectIndividual(aluno, index)}
            >
              <p><strong>Nome:</strong> {aluno.student_name}</p>
              <p><strong>Turma:</strong> {aluno.student_class}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className="status"
                  style={{
                    color: status === "Não iniciado" ? "#333" : "#fff",
                    backgroundColor:
                      status === "Em processamento"
                        ? "green"
                        : status === "Iniciado"
                        ? "#836d0c"
                        : status === "Concluído"
                        ? "red"
                        : "inherit",
                  }}
                >
                  &nbsp;{status}&nbsp;
                </span>
              </p>
              {locked && (
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                  Aguarde <strong>{formatTime(countdowns[studentId] || 0)}</strong> min para nova solicitação.
                </p>
              )}
            </div>
          );
        })
      ) : (
        <p>Nenhum aluno encontrado.</p>
      )}

      <button
        onClick={handleCheckout}
        disabled={selectedStudents.size === 0 || allStudentsLocked || btnTxt === "Aguarde...."}
        className="btn-list"
        style={{
          color: selectedStudents.size > 0 && !allStudentsLocked ? "#000" : "#fff",
          backgroundColor: selectedStudents.size > 0 && !allStudentsLocked ? "#f26729" : "#ccc",
          cursor: selectedStudents.size > 0 && !allStudentsLocked ? "pointer" : "not-allowed",
        }}
      >
        {btnTxt}
      </button>
    </div>
  );
}

export default StudentList;
