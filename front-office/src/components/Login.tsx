import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

//const BACKEND_URL = "https://back-end-2vzw.onrender.com/api";
const BACKEND_URL = "http://localhost:3000/api";

function Login() {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    const savedPhone = localStorage.getItem("savedPhone");
    const savedAlunos = localStorage.getItem("alunos");

    if (savedPhone && savedAlunos) {
      navigate("/students", { replace: true });
      return;
    }

    if (!token) {
      setError("Acesso não autorizado. Use um QR Code válido.");
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/validate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) {
          setError("Token inválido ou expirado.");
        } else {
          console.log("✅ Token válido para:", data.clientId);
        }
      })
      .catch(() => {
        setError("Erro ao validar token.");
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const validatePhone = (num: string) => /^351\d{9}$/.test(num);

  const handleLogin = async () => {
    if (!validatePhone(phone)) {
      setError("Formato inválido. Use 3519XXXXXXXX");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.students?.length > 0) {
  const caregiverName = data.caregiver_name;
  const caregiverId = data.caregiver_id;

  // Mapeia os alunos adicionando os campos esperados
  const alunos = data.students.map((student: any) => ({
    student_id: student.student_id,
    student_name: student.student_name_official,
    spot_name: student.spot_name_official,
    caregiver_name: caregiverName,
  }));

  localStorage.setItem("savedPhone", phone);
  localStorage.setItem("alunos", JSON.stringify(alunos));
  localStorage.setItem("responsavel", JSON.stringify({ id: caregiverId, nome: caregiverName }));

  navigate("/students", { replace: true });
      } else {
        setError("Nenhum aluno encontrado para este responsável.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content login">
      <div className="container">
        <h2>Login por TELEFONE</h2>

        {loading ? (
          <p>Validando token...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <input
              type="number"
              placeholder="(ex: 351910000001)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="no-spinner"
              autoFocus
              inputMode="numeric"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Carregando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
