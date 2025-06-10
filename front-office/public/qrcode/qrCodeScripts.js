const urlParams = new URLSearchParams(window.location.search);
const serialElem = urlParams.get('serialNumber');
const serialInfo = document.getElementById('serialInfo');
const warningDiv = document.querySelector('.warning');

let lastUpdate;

if (serialElem) {
    serialInfo.innerHTML = `<b>Serial number:</b> ${serialElem}`;

    fetch('/qrcode/qrCodeMensagens.json')
    .then(res => res.json())
    .then(mensagens => {
        const mensagem = mensagens[serialElem];

        if (mensagem) {
            warningDiv.textContent = mensagem;
            warningDiv.style.display = 'block';
            // warningDiv.classList.add('warning'); // adiciona a classe com os estilos
        }else{
              warningDiv.style.display = 'none';
        }
    })
    .catch(err => console.warn('Erro ao carregar mensagens.json:', err));
}else{
    serialInfo.remove();
    warningDiv.style.display = 'none';
}

const BASE_URL = "https://back-end-2vzw.onrender.com";

function conectarSSE() {
    const evtSource = new EventSource(`${BASE_URL}/events`);

    evtSource.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        lastUpdate = data.timestamp;

        if (lastUpdate) {
        const lastUpdateInfo = document.getElementById('lastUpdate');
        const date = new Date(lastUpdate);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0'); // meses começam em 0
        const ano = date.getFullYear();
        const hora = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');

        lastUpdateInfo.innerHTML = `<b>Última atualização:</b> ${dia}/${mes}/${ano} às ${hora}h${minutos}min`;
        }

        if (data.type === "qrcode-updated") {
        console.log("📡 Novo QR Code detectado via SSE");

        const img = document.getElementById("qrcode");
        const loading = document.getElementById("loading");

        loading.style.display = "flex";
        img.style.display = "none";

        setTimeout(() => {
            const timestamp = Date.now();
            const newImg = new Image();
            newImg.src = `${BASE_URL}/api/qrcode?ts=${timestamp}`;

            newImg.onload = () => {
            img.src = newImg.src;
            loading.style.display = "none";
            img.style.display = "block";
            };

            newImg.onerror = () => {
            console.warn("⚠️ Erro ao carregar novo QR Code");
            };
        }, 2000); // Apenas um charme.
        }
    } catch (err) {
        console.warn("❌ Erro ao interpretar evento SSE:", err);
    }
    };

    evtSource.onerror = (err) => {
    console.warn("⚠️ SSE desconectado. Tentando reconectar em 5s...", err);
    evtSource.close();
    setTimeout(conectarSSE, 5000);
    };
}

conectarSSE();
