// public/service-worker.js

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker instalado");
  self.skipWaiting(); // ativa imediatamente
});

self.addEventListener("activate", (event) => {
  console.log("🔁 Service Worker ativado");
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || "Nova notificação", {
    body: data.body || "Você tem uma nova atualização.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
});
