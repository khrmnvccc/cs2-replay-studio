// ACE ilovasi uchun minimal service worker: o'rnatish imkonini beradi.
// Ma'lumotlar keshlanmaydi — har doim saytdagi eng yangi holat ko'rsatiladi.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
