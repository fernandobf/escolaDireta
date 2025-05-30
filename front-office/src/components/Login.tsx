import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbzXbl0HQ9NfsskL3fxz_-QUeBAyxeh85GblPpPN6aObkqjmu_gadjzb2yJS22CUDTYL/exec";

function Login() {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // já começa como true
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

  fetch("https://back-end-2vzw.onrender.com/api/validate-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.valid) {
        setError("Token inválido ou expirado.");
      } else {
        console.log("✅ Token válido para:", data.clientId);
        // Redireciona para a área protegida imediatamente após validação
        navigate("/students", { replace: true });
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
      const res = await fetch(`${BACKEND_URL}?act=login&phone=${phone}`);
      const data = await res.json();

      if (data.alunos?.length > 0) {
        localStorage.setItem("savedPhone", phone);
        localStorage.setItem("alunos", JSON.stringify(data.alunos));
        navigate("/students", { replace: true });
      } else {
        setError("Nenhum aluno encontrado.");
      }
    } catch (err) {
      setError("Erro ao conectar.");
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
          <>
            <input
              type="number"
              placeholder="(ex: 351910000001)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={handleLogin} disabled={loading}>
              {loading ? "Carregando..." : "Entrar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
