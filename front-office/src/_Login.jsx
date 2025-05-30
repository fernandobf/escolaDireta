
import React, { useEffect, useState } from 'react';

function Login() {
  const [status, setStatus] = useState('validating');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    if (!token) return setStatus('error');

    fetch('https://back-end-2vzw.onrender.com/api/validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.valid) setStatus('ok');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'validating') return <p>Validando QR Code...</p>;
  if (status === 'error') return <p>QR Code inválido ou expirado.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Identifique-se</h2>
      <input
        type="tel"
        placeholder="Seu telefone"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <button onClick={() => alert('Simulação de login com telefone: ' + phone)}>
        Entrar
      </button>
    </div>
  );
}

export default Login;
