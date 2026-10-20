# CS2 Match Replay Studio

Counter-Strike 2 o'yinchilari uchun platforma: Steam akkauntini ulash, matchlarni ko'rish, demo fayldan barcha kill lavhalarini topish va ularni MP4 qilib yuklab olish.

Bu prototip emas: Steam OpenID haqiqiy, ma'lumotlar Supabase (PostgreSQL + RLS) da saqlanadi, demo tahlili haqiqiy CS2 demo parser bilan ishlaydi, video esa haqiqiy CS2 + HLAE render orqali yaratiladi. Soxta match, soxta statistika va soxta video **yo'q** — ma'lumot manbasi yo'q joyda interfeys buni ochiq aytadi.

---

## Mundarija

1. [Valve nimani beradi va nimani bermaydi](#1-valve-nimani-beradi-va-nimani-bermaydi)
2. [Arxitektura](#2-arxitektura)
3. [Lokal ishga tushirish](#3-lokal-ishga-tushirish)
4. [Supabase sozlash](#4-supabase-sozlash)
5. [Steam OpenID va Steam API key](#5-steam-openid-va-steam-api-key)
6. [Worker (demo tahlili, match tarixi, ZIP)](#6-worker-demo-tahlili-match-tarixi-zip)
7. [Valve Game Coordinator bot (ixtiyoriy)](#7-valve-game-coordinator-bot-ixtiyoriy)
8. [Render worker — MP4 video (Windows)](#8-render-worker--mp4-video-windows)
9. [Deploy: Vercel + worker server](#9-deploy-vercel--worker-server)
10. [Testlar](#10-testlar)
11. [Xavfsizlik](#11-xavfsizlik)
12. [Loyiha tuzilmasi](#12-loyiha-tuzilmasi)
13. [GitHub'ga yuklash](#13-githubga-yuklash)

---

## 1. Valve nimani beradi va nimani bermaydi

| Funksiya | Manba | Holat |
|---|---|---|
| Steam'ga kirish, avatar, nickname, profil havolasi | Steam OpenID 2.0 + `ISteamUser/GetPlayerSummaries/v2` | Avtomatik |
| Matchlar ro'yxati | `ICSGOPlayers_730/GetNextMatchSharingCode/v1` (rasmiy Steam Web API) | Foydalanuvchi bir marta **Game Authentication Code** va oxirgi **share code**ni kiritadi |
| Match sanasi, hisob, K/D/A, HS, davomiylik, demo havolasi | Valve Game Coordinator (`steam-user` + `globaloffensive`) | Alohida Steam **bot akkaunt** bilan worker kerak |
| Raundlar, kill eventlar (vaqt, killer, raqib, qurol, headshot, wallbang…) | Demo faylni tahlil qilish (`@laihoe/demoparser2`) | Avtomatik (demo yuklangandan keyin) |
| MP4 video | CS2 o'yin klienti demo'ni ijro etadi, HLAE yozadi, FFmpeg kodlaydi | **Windows** kompyuter + CS2 + HLAE + CS Demo Manager |

Muhim faktlar:

- Steam Web API **tayyor kill videolarini va istalgan matchning demo faylini bermaydi**. U faqat share code'larni qaytaradi.
- Share code'dan match ID, outcome ID va token dekodlanadi (`shared/sharecode.ts`). Lekin hisob va statistika uchun GC yoki demo kerak.
- Valve replay serveridagi demolar (`replayNNN.valve.net/730/….dem.bz2`) bir necha haftadan keyin o'chiriladi. Keyin faqat foydalanuvchining o'zi yuklagan demo qoladi.
- FACEIT, ESEA, turnir matchlari Valve API'da yo'q. Ularning `.dem` faylini yuklang, tahlil bir xil ishlaydi.
- CS2 demo'dan videoni "serverda headless" render qilishning rasmiy yo'li yo'q. Video faqat o'yin klientida yoziladi. Shuning uchun render alohida Windows worker'da bajariladi. Render worker ulanmaguncha cliplar "Render navbatida" holatida turadi, soxta video yaratilmaydi.
- Demo fayl yuklanganda sanasi bo'lmaydi (CS2 demo header'ida sana yozilmaydi). Sana faqat GC'dan keladi.

## 2. Arxitektura

```
 Brauzer ──► Next.js (Vercel)  ──────────────►  Supabase
   │          • Steam OpenID, sessionlar         • PostgreSQL + RLS
   │          • API route'lar (yengil ishlar)    • Storage: demos / clips / exports (private)
   │          • processing_jobs ga ish qo'yadi   • processing_jobs navbati
   │                                                  ▲            ▲
   └── TUS resumable upload (6 MB bo'laklar) ─► Storage│            │
                                                       │            │
            Linux worker (Docker/VPS) ─────────────────┘            │
            parse · sync · gc · zip                                 │
                                                                    │
            Windows render worker ──────────────────────────────────┘
            render: CS Demo Manager CLI → CS2 + HLAE → FFmpeg → MP4
```

- **Og'ir ishlar Vercel'da bajarilmaydi.** Demo fayl brauzerdan to'g'ridan-to'g'ri Supabase Storage'ga (TUS, davom ettiriladigan) yuklanadi. Next.js faqat ruxsat beradi va faylning birinchi baytlarini tekshiradi.
- **Navbat** — Postgres jadvali `processing_jobs`. Worker `claim_job()` funksiyasi (`FOR UPDATE SKIP LOCKED`) orqali ish oladi, har 15 soniyada heartbeat yuboradi. Worker o'lib qolsa `requeue_stale_jobs()` ishni qayta navbatga qo'yadi. Xato bo'lsa exponential backoff bilan qayta uriniladi (`max_attempts`).
- **Progress**: worker `progress` va `progress_message` ni yangilaydi, UI har 2.5 soniyada so'raydi.
- Har bir worker o'z **qobiliyatlarini** e'lon qiladi (`workers` jadvali). UI qaysi komponent onlayn ekanini ko'rsatadi ("Tizim holati" sahifasi).

### Jadval va ishlar

| Jadval | Vazifasi |
|---|---|
| `users` | Foydalanuvchi va sozlamalar (`settings` jsonb: clip davomiyligi, video sifati, saqlash muddati) |
| `sessions` | Server tomonidagi sessionlar (logout, "barcha qurilmalardan chiqish") |
| `openid_nonces` | OpenID javobini qayta ishlatishdan himoya |
| `steam_accounts` | SteamID64, profil, shifrlangan auth code, oxirgi share code |
| `matches` | Matchlar (share code yoki demo upload) |
| `match_rounds` | Raundlar |
| `demo_files` | Yuklangan demolar va tahlil holati |
| `kill_events` | Har bir kill |
| `clips` | Cliplar va render holati |
| `processing_jobs` | Ishlar navbati |
| `workers` | Worker heartbeat'lari |

| Ish turi | Qobiliyat | Nima qiladi |
|---|---|---|
| `sync_matches` | `sync` | Valve'dan yangi share code'larni oladi |
| `fetch_match_info` | `gc` | GC'dan sana, hisob, statistika, demo URL |
| `download_demo` | `sync` | Valve replay serveridan demo'ni storage'ga ko'chiradi |
| `parse_demo` | `parse` | Demo tahlili: raundlar, killlar, statistika |
| `render_clip` | `render` | MP4 render (Windows) |
| `zip_clips` | `zip` | Tanlangan cliplarni ZIP qiladi |

## 3. Lokal ishga tushirish

Talablar: Node.js 22+, npm, Supabase loyihasi (bulut yoki `supabase start`), Steam API key.

```bash
# 1. Bog'liqliklar
npm install
cd worker && npm install && cd ..

# 2. Muhit o'zgaruvchilari
cp .env.example .env.local
cp worker/.env.example worker/.env
# Kalitlarni yarating:
openssl rand -base64 48   # SESSION_SECRET
openssl rand -base64 32   # APP_ENCRYPTION_KEY (web va worker'da bir xil)

# 3. Supabase migratsiyalari (4-bo'lim)

# 4. Web ilova
npm run dev               # http://localhost:3000

# 5. Worker (alohida terminalda)
cd worker
set -a; source .env; set +a
npm start
```

`.env.local` va `worker/.env` `.gitignore`da — GitHub'ga yuklanmaydi. Agar biror o'zgaruvchi yetishmasa, sayt "Server hali sozlanmagan" sahifasida aynan qaysisi yo'qligini ko'rsatadi.

## 4. Supabase sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha yarating.
2. **Project Settings → API** dan oling:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` (worker'da `SUPABASE_URL`)
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (faqat server va worker'da!)
3. **Project Settings → JWT Keys → Legacy JWT secret** → `SUPABASE_JWT_SECRET`.
   Server shu kalit bilan har bir foydalanuvchi uchun qisqa muddatli JWT (`sub = users.id`, `role = authenticated`) imzolaydi. Shuning uchun RLS siyosatlari (`auth.uid()`) bizning Steam login'imiz bilan ishlaydi. Supabase Auth ishlatilmaydi, faqat Steam.
   Agar loyihangizda legacy secret o'chirilgan bo'lsa, JWT Keys bo'limida HS256 "shared secret" kalitini qo'shing va o'shani bering.
4. Migratsiyalarni qo'llang:
   - **CLI orqali**: `npx supabase link --project-ref <ref>` keyin `npx supabase db push`
   - **yoki** SQL Editor'da tartib bilan ishga tushiring:
     `supabase/migrations/20261020000001_init.sql`, keyin `supabase/migrations/20261020000002_storage.sql`
5. **Storage hajm limiti.** CS2 demolari 50–600 MB. Supabase **Free** planida bitta faylning global limiti **50 MB**. Katta demolar uchun Pro plan kerak: **Storage → Settings → Upload file size limit** ni oshiring (masalan 1 GB). `DEMO_MAX_MB` ni ham shunga moslang.
6. Bucketlar (`demos`, `clips`, `exports`) migratsiya bilan **private** holatda yaratiladi. Yuklab olish faqat server bergan 60 soniya–1 soatlik signed URL orqali bo'ladi.

## 5. Steam OpenID va Steam API key

1. [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) da domeningizni kiritib API key oling → `STEAM_API_KEY`. **Ixtiyoriy:** kalitsiz ham Steam login ishlaydi (nik va avatar ochiq profil XML'dan olinadi), faqat match tarixi ulanmaydi. Steam kalitni faqat o'yin sotib olingan akkauntga beradi.
   Key faqat serverda ishlatiladi (`NEXT_PUBLIC_` prefiksi yo'q).
2. `APP_URL` ni saytning haqiqiy manziliga qo'ying (`https://replay.example.com`). Steam `return_to` va `realm` shu manzildan quriladi. Lokalda `http://localhost:3000` ishlaydi.
3. OpenID uchun Steam'da alohida ro'yxatdan o'tish shart emas.

Login oqimi (`src/app/api/auth/steam/*`, `src/lib/steam/openid.ts`):

1. `/api/auth/steam/login` tasodifiy `state` yaratadi (HttpOnly cookie) va Steam'ga yo'naltiradi.
2. Foydalanuvchi parolni **faqat steamcommunity.com da** kiritadi.
3. `/api/auth/steam/callback` quyidagilarni tekshiradi: `state` cookie; `op_endpoint`; `return_to`; `claimed_id` formati; imzolangan maydonlar; `response_nonce` yoshi (5 daqiqa); keyin Steam serveriga `check_authentication` yuborib `is_valid:true` ni oladi; nonce takrorlanmasligini bazada tekshiradi.
4. `GetPlayerSummaries` dan profil olinadi, foydalanuvchi yaratiladi yoki yangilanadi, session yaratiladi (`rs_session` cookie: HttpOnly, SameSite=Lax, prod'da Secure, 30 kun).

### Match tarixini ulash (foydalanuvchi uchun)

Settings → **Match tarixi**:

1. [Steam: CS2 match history](https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128) sahifasida **Authentication Code** yarating (`XXXX-XXXXX-XXXX`).
2. Oxirgi matchning share code'ini nusxalang (`CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx`).
3. Kodlar saqlanishidan oldin Valve'da tekshiriladi. Auth code AES-256-GCM bilan shifrlanadi va foydalanuvchiga ham qaytarilmaydi (ustun darajasidagi grant).
4. "Refresh matches" tugmasi worker'da `sync_matches` ishini boshlaydi.

## 6. Worker (demo tahlili, match tarixi, ZIP)

```bash
# Docker (repo ildizidan)
docker build -f worker/Dockerfile -t cs2-replay-worker .
docker run -d --restart unless-stopped --env-file worker/.env -v replay-data:/data cs2-replay-worker
```

`worker/.env`da `WORKER_CAPABILITIES=parse,sync,zip` bo'ladi (GC bot bo'lsa `gc` ni qo'shing). Bir nechta worker ishga tushirsangiz, ular navbatni xavfsiz bo'lishadi.

Demo tahlili (`worker/src/lib/demo-analysis.ts`) quyidagilarni oladi:

- Xarita (header).
- Tickrate (`game_time` bo'yicha o'lchanadi).
- Raundlar (`round_end`, `round_freeze_end`); warmup va restartlar chiqarib tashlanadi.
- Har bir `player_death`: tick, raund, raund ichidagi vaqt, killer, raqib, assister, tomonlar, qurol, headshot, wallbang, noscope, tutun orqali, ko'r holda.
- Yakuniy hisob va foydalanuvchining K/D/A/HS (SteamID64 bo'yicha). Foydalanuvchi demoda bo'lmasa, statistika hisoblanmaydi va UI buni aytadi.

## 7. Valve Game Coordinator bot (ixtiyoriy)

Share code faqat matchni aniqlaydi. Sana, hisob, K/D va demo havolasi Valve GC'dan olinadi. Buning uchun:

1. **Alohida** Steam akkaunt yarating (asosiy akkauntingizni ishlatmang). Unda CS2 bo'lishi va Steam Guard yoqilgan bo'lishi kerak.
2. Kirish usullaridan birini tanlang:
   - `STEAM_BOT_USERNAME` + `STEAM_BOT_PASSWORD` + `STEAM_BOT_SHARED_SECRET` (Steam Desktop Authenticator'dagi shared secret), yoki
   - `STEAM_BOT_REFRESH_TOKEN`. Bir marta parol bilan kirganda `steam-user` `refreshToken` hodisasini beradi; shu qiymatni saqlang.
3. Worker'ga `gc` qobiliyatini qo'shing.

Settings'dagi "Valve demolarini avtomatik yuklab olish" yoqilsa, GC topgan demo avtomatik yuklanadi va tahlil qilinadi. Aks holda match sahifasida "Valve'dan yuklab, tahlil qilish" tugmasi chiqadi.

> GC bilan ishlash Valve'ning rasmiy ommaviy API'si emas: Steam klienti ishlatadigan protokol. Bu keng qo'llaniladi (CS Demo Manager, Leetify va boshqalar), lekin Valve uni istalgan vaqtda o'zgartirishi mumkin.

## 8. Render worker — MP4 video (Windows)

Demo'dan kill vaqtini topish (tahlil) va haqiqiy MP4 yaratish ikki xil jarayon. Tahlil Linux'da bir necha soniyada bajariladi. Video esa faqat o'yin klientida yoziladi.

Talablar (bitta Windows kompyuter yoki GPU'li Windows VM):

1. Steam + **Counter-Strike 2** o'rnatilgan, akkaunt login qilingan.
2. [**CS Demo Manager**](https://cs-demo-manager.com) — ichida `csdm` CLI bor (`csdm analyze`, `csdm video`). U HLAE va FFmpeg'ni o'zi yuklab, CS2'ni boshqaradi. O'rnatgandan keyin ilovani bir marta ochib, video sozlamalarini tekshiring (Recording system: HLAE, Encoder: FFmpeg).
3. [HLAE](https://www.advancedfx.org) — CS Demo Manager uni o'rnatadi yoki o'zingiz o'rnating.
4. Node.js 22+ va `ffmpeg` PATH'da (natijani veb MP4 ga keltirish va thumbnail uchun).

Ishga tushirish:

```powershell
cd worker
copy .env.example .env
# .env:
#   WORKER_CAPABILITIES=render
#   RENDER_BACKEND=csdm
#   CSDM_PATH=C:\Program Files\CS Demo Manager\csdm.exe   (csdm.exe qayerda bo'lsa)
.\windows\start-render-worker.ps1
```

Har bir clip uchun worker quyidagilarni bajaradi:

1. Demo'ni yuklab oladi (bz2 bo'lsa ochadi, keshlaydi).
2. `csdm analyze <demo>` (har bir demo uchun bir marta).
3. `csdm video <demo> <startTick> <endTick> --focus-player <SteamID64> --width … --height … --framerate … --recording-system HLAE --encoder-software FFmpeg --close-game-after-recording`.
4. Natijani `ffmpeg` bilan H.264/AAC MP4 (`+faststart`) ga keltiradi va thumbnail oladi.
5. `clips` bucket'iga yuklaydi va clip holatini `ready` qiladi.

O'z render skriptingiz bo'lsa: `RENDER_BACKEND=command` va `RENDER_COMMAND` (`{demo} {start} {end} {steamid} {out} {width} {height} {fps}` o'rinbosarlari). Skript `{out}` ga video yozishi shart. Buyruq shell'siz ishga tushiriladi.

Eslatmalar:

- Render paytida CS2 oynasi ochiladi; kompyuterda boshqa ish qilmang. Worker bir vaqtda faqat bitta clip render qiladi.
- Bir clip (6 soniya) odatda 30–90 soniya oladi (o'yinni ishga tushirish + yozish + kodlash).
- CS2 yangilanishlari HLAE'ni vaqtincha buzishi mumkin. Bunda HLAE va CS Demo Manager'ni yangilang.
- `csdm video` buyrug'i CS Demo Manager'ning so'nggi versiyalarida bor. Ishlatishdan oldin `csdm video --help` bilan tekshiring.
- Bu qism shu muhitda (Linux, CS2'siz) end-to-end sinab ko'rilmagan. Buyruq argumentlari va FFmpeg post-processing testlar bilan tekshirilgan.

## 9. Deploy: Vercel + worker server

**Web (Vercel):**

1. Repo'ni GitHub'ga yuklang (13-bo'lim) va Vercel'da **Import Project** qiling. Framework: **Next.js**, Root Directory: **bo'sh** (`public` emas!).
2. **Settings → Environment Variables** ga `.env.example` dagi barcha o'zgaruvchilarni kiriting. `APP_URL=https://<domeningiz>` bo'lsin.
3. Steam API key'dagi domenni Vercel domeniga moslang.
4. Deploy. `worker/` papkasi Vercel build'ga kirmaydi.

**Worker:**

- Linux worker: istalgan VPS (Hetzner, DigitalOcean va h.k.), Railway yoki Fly.io'da Docker image (6-bo'lim). 1–2 GB RAM yetarli; `/data` volume'da 5–10 GB joy bo'lsin.
- Render worker: Windows kompyuter yoki GPU'li Windows VM (8-bo'lim).

Rate limit: API'da har bir foydalanuvchi va route uchun oddiy limiter bor (`src/lib/server/rate-limit.ts`). U bitta instans xotirasida ishlaydi. Production'da qo'shimcha ravishda Vercel Firewall rate limiting yoqing.

## 10. Testlar

```bash
npm test                    # unit testlar: OpenID tekshiruvi, share code, Steam API, fayl validatsiyasi, shifrlash
npm run typecheck && npm run lint && npm run build

cd worker
npm test                    # render argumentlari, FFmpeg post-processing
DEMO_FIXTURE=/path/match.dem npm test   # haqiqiy CS2 demo tahlili

# Migratsiya + RLS testlari (lokal PostgreSQL superuser kerak)
PGHOST=localhost PGPORT=5432 PGUSER=postgres npm run test:db
```

RLS testi tekshiradigan narsalar:

- A foydalanuvchi B ning matchlari, profili va cliplarini ko'rmaydi va o'chira olmaydi.
- Shifrlangan auth code ustunini o'qib bo'lmaydi.
- Foydalanuvchi clip statusini yoki fayl yo'lini o'zgartira olmaydi.
- Storage'da faqat o'z papkasiga yozish mumkin; `clips` bucket'iga yozib bo'lmaydi.
- `claim_job` bitta ishni ikki marta bermaydi; `requeue_stale_jobs` ishlaydi.

## 11. Xavfsizlik

- **Steam paroli hech qachon so'ralmaydi va saqlanmaydi.** Faqat OpenID ishlatiladi.
- Barcha kalitlar environment variable'larda. `.env*` gitignore'da, faqat `.env.example` commit qilinadi.
- **RLS:** foydalanuvchi so'rovlari `auth.uid()` bilan cheklangan klient (`userDb`) orqali o'tadi. `service_role` faqat login, session va signed URL uchun ishlatiladi.
- **CSRF:** barcha o'zgartiruvchi API so'rovlarida `Origin` tekshiriladi; cookie `SameSite=Lax`.
- **Fayl tekshiruvi:**
  - kengaytma (`.dem`, `.dem.bz2`), nom belgilari, min/max hajm;
  - yuklangandan keyin magic baytlar (`PBDEMS2\0` yoki `BZh`); CS:GO va boshqa fayllar o'chiriladi;
  - bucket'da MIME cheklovi;
  - fayl yo'li serverda yaratiladi (`<userId>/<uuid>.dem`) — foydalanuvchi nomi yo'lga tushmaydi.
- **Session:** bazada saqlanadi, logout va "barcha qurilmalardan chiqish" bekor qiladi; IP faqat hash ko'rinishida.
- **Security header'lar:** `X-Frame-Options`, `nosniff`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`.
- **Tashqi dasturlar** (csdm, ffmpeg) shell'siz, argument massivi bilan ishga tushiriladi.
- **Saqlash muddati:** worker har soatda muddati o'tgan demo fayllarni (sozlama: 7–365 kun) va 1 kundan eski ZIP'larni o'chiradi; tahlil natijalari va cliplar qoladi.

## 12. Loyiha tuzilmasi

```
src/app/                       Next.js App Router
  page.tsx                     Landing
  (app)/dashboard|matches|matches/[id]|clips|settings|system
  api/auth/steam/{login,callback}, api/auth/logout
  api/match-history, api/matches/*, api/demos/*, api/clips/*, api/jobs/*, api/exports/*, api/settings
src/components/                UI (dizayn tizimi: src/components/ui)
src/lib/steam/                 OpenID va Steam Web API (worker ham ishlatadi)
src/lib/server/                env, session, supabase klientlari, data layer, http yordamchilar
shared/                        Web va worker uchun umumiy: sharecode, steamid, demo-file, clip, maps, jobs, secret-box
supabase/migrations/           SQL sxema, RLS, storage
supabase/tests/                RLS testlari
worker/src/                    Navbat, ishlar (jobs/), demo tahlili, GC, render, storage
worker/Dockerfile              Linux worker
worker/windows/                Windows render worker skripti
tests/                         Web unit testlari
```

Xarita rasmlari: rasmiy xarita rasmlari Valve mulki bo'lgani uchun kartochkalarda xarita rangidagi gradient ishlatiladi. O'z rasmlaringiz bo'lsa, `public/maps/` ga qo'ying va `shared/maps.ts` dagi `MAP_IMAGES` ga qo'shing.

## 13. GitHub'ga yuklash

```bash
cd cs2-replay-studio
git remote add origin https://github.com/<login>/cs2-replay-studio.git
git push -u origin main
```

Repo yaratish: GitHub → **New repository** → nom `cs2-replay-studio` → README'siz yarating → yuqoridagi buyruqlar.
