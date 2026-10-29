// Darsliklar: har bir oyna uchun qadamlar. target — sahifadagi data-tour="..." elementi;
// bo'lmasa qadam ekran o'rtasida chiqadi. Matnlar ikki tilda (darslik oynasida UZ/RU almashadi).
export type TourBadge = "action" | "watch" | "optional";
export type L = { uz: string; ru: string };
export interface TourStep {
  target?: string;
  badge?: TourBadge;
  title: L;
  text?: L;
  legend?: boolean;
}

export const BADGES: Record<TourBadge, L> = {
  action: { uz: "Sizdan harakat kerak", ru: "Нужно ваше действие" },
  watch: { uz: "Faqat kuzating", ru: "Просто наблюдайте" },
  optional: { uz: "Kerak bo'lsa", ru: "При необходимости" },
};

const NAV: TourStep[] = [
  {
    target: "nav-clips",
    badge: "watch",
    title: { uz: "Kliplar", ru: "Клипы" },
    text: { uz: "Tanlagan killaringizdan tayyorlangan videolar shu yerda. Yuklab olsangiz, Telegram'ga ham boradi.", ru: "Здесь видео из выбранных вами убийств. При скачивании копия уходит и в Telegram." },
  },
  {
    target: "nav-stats",
    badge: "watch",
    title: { uz: "Statistika", ru: "Статистика" },
    text: { uz: "Umumiy K/D, g'alaba foizi va har bir xaritadagi natijalaringiz.", ru: "Общий K/D, процент побед и результаты по каждой карте." },
  },
  {
    target: "nav-menu",
    badge: "action",
    title: { uz: "Menyu", ru: "Меню" },
    text: { uz: "Profil, Telegram ulash, Rekordlar, til va tungi rejim shu yerda.", ru: "Профиль, подключение Telegram, рекорды, язык и ночной режим." },
  },
  {
    target: "bell",
    badge: "watch",
    title: { uz: "Bildirishnomalar", ru: "Уведомления" },
    text: { uz: "Yangi o'yin, tayyor klip va eslatmalar shu yerga keladi. Qizil nuqta — o'qilmagan xabar.", ru: "Сюда приходят новые матчи, готовые клипы и напоминания. Красная точка — непрочитанное." },
  },
  {
    target: "help",
    badge: "optional",
    title: { uz: "Tushunmasangiz — shu tugma", ru: "Если непонятно — эта кнопка" },
    text: { uz: "Har bir oynada ? tugmasi bor. Bossangiz, o'sha oynaning darsligi qayta ko'rsatiladi.", ru: "Кнопка ? есть в каждом окне. Нажмите — урок этого окна покажется снова." },
  },
];

export const TOURS: Record<string, TourStep[]> = {
  matches: [
    {
      title: { uz: "ACE'ga xush kelibsiz!", ru: "Добро пожаловать в ACE!" },
      text: { uz: "CS2 o'yinlaringiz, killaringiz va kliplaringiz bir joyda. Qisqa tanishtiruv — bir daqiqa.", ru: "Ваши матчи CS2, убийства и клипы в одном месте. Короткое знакомство — одна минута." },
    },
    { legend: true, title: { uz: "Uch xil belgi", ru: "Три вида значков" } },
    {
      target: "sync",
      badge: "action",
      title: { uz: "Shu yerdan boshlang", ru: "Начните отсюда" },
      text: { uz: "«Sinxronlash» Steam'dan yangi o'yinlaringizni oladi. Birinchi marta Sozlamalarda 2 ta kod kiritiladi.", ru: "«Синхронизация» забирает новые матчи из Steam. В первый раз в настройках вводятся 2 кода." },
    },
    {
      target: "upload",
      badge: "optional",
      title: { uz: "Demo yuklash", ru: "Загрузка демо" },
      text: { uz: "FACEIT yoki boshqa o'yin bo'lsa, demo faylni o'zingiz yuklang — killar avtomatik topiladi.", ru: "Для FACEIT и других матчей загрузите демо сами — убийства найдутся автоматически." },
    },
    {
      target: "demo-tabs",
      badge: "watch",
      title: { uz: "Yuklangan va yuklanmagan", ru: "Загруженные и нет" },
      text: { uz: "Demosi tahlil qilingan o'yinlarda hisob jadvali, raundlar va killar bor.", ru: "В матчах с проанализированным демо есть таблица счёта, раунды и убийства." },
    },
    {
      target: "modes",
      badge: "optional",
      title: { uz: "Rejim va xarita", ru: "Режим и карта" },
      text: { uz: "Premier, Competitive va xarita bo'yicha saralang.", ru: "Сортируйте по Premier, Competitive и карте." },
    },
    {
      target: "match-list",
      badge: "watch",
      title: { uz: "O'yin kartasi", ru: "Карточка матча" },
      text: { uz: "Kartani bosing: hisob, 10 o'yinchi jadvali, raundlar va killar ochiladi.", ru: "Нажмите на карточку: откроются счёт, таблица 10 игроков, раунды и убийства." },
    },
    ...NAV,
  ],
  match: [
    {
      target: "match-hero",
      badge: "watch",
      title: { uz: "O'yin natijasi", ru: "Итог матча" },
      text: { uz: "Hisob, xarita, davomiylik va natija.", ru: "Счёт, карта, длительность и результат." },
    },
    {
      target: "match-actions",
      badge: "action",
      title: { uz: "Montaj yaratish", ru: "Создать монтаж" },
      text: { uz: "Kerakli killarni belgilang — ulardan klip tayyorlanadi. «Tez orada» deb yozilganlar keyin ochiladi.", ru: "Отметьте нужные убийства — из них сделают клипы. Пункты «скоро» откроются позже." },
    },
    {
      target: "match-tabs",
      badge: "watch",
      title: { uz: "Bo'limlar", ru: "Разделы" },
      text: { uz: "Hisob jadvali, raundlar, killar va demo holati. Sizning qatoringiz ajratib ko'rsatiladi.", ru: "Таблица счёта, раунды, убийства и статус демо. Ваша строка выделена." },
    },
  ],
  clips: [
    {
      target: "clips-list",
      badge: "watch",
      title: { uz: "Kliplaringiz", ru: "Ваши клипы" },
      text: { uz: "Har bir klipni ko'rish, MP4 yuklab olish yoki Telegram'ga yuborish mumkin.", ru: "Каждый клип можно посмотреть, скачать в MP4 или отправить в Telegram." },
    },
    {
      target: "clips-zip",
      badge: "optional",
      title: { uz: "Bir nechtasini birdan", ru: "Сразу несколько" },
      text: { uz: "Kliplarni belgilab, bitta ZIP qilib yuklab oling.", ru: "Отметьте клипы и скачайте одним ZIP." },
    },
  ],
  stats: [
    {
      target: "stats-profile",
      badge: "action",
      title: { uz: "Profil va yangilash", ru: "Профиль и обновление" },
      text: { uz: "Match tarixi ulanmagan bo'lsa, shu yerdan ulang.", ru: "Если история матчей не подключена — подключите здесь." },
    },
    {
      target: "stats-grid",
      badge: "watch",
      title: { uz: "Ko'rsatkichlar", ru: "Показатели" },
      text: { uz: "Tahlil qilingan o'yinlar bo'yicha K/D, g'alaba va headshot foizi.", ru: "K/D, победы и процент хедшотов по проанализированным матчам." },
    },
    {
      target: "stats-maps",
      badge: "watch",
      title: { uz: "Xaritalar bo'yicha", ru: "По картам" },
      text: { uz: "Qaysi xaritada yaxshi o'ynayotganingizni ko'ring.", ru: "Смотрите, на какой карте вы играете лучше." },
    },
  ],
  records: [
    {
      target: "records-grid",
      badge: "watch",
      title: { uz: "Shaxsiy rekordlar", ru: "Личные рекорды" },
      text: { uz: "Eng yaxshi natijalaringiz. Kartani bossangiz, o'sha o'yin ochiladi.", ru: "Ваши лучшие результаты. Нажмите на карточку — откроется матч." },
    },
  ],
  settings: [
    {
      target: "settings-history",
      badge: "action",
      title: { uz: "Match tarixini ulash", ru: "Подключение истории матчей" },
      text: { uz: "Steam'dagi 2 ta kodni kiriting — shundan keyin o'yinlaringiz o'zi chiqadi.", ru: "Введите 2 кода из Steam — после этого матчи будут появляться сами." },
    },
  ],
  admin: [
    {
      target: "admin-templates",
      badge: "watch",
      title: { uz: "Shablonlar", ru: "Шаблоны" },
      text: { uz: "Har bir xabarni yoqing yoki o'chiring. Bossangiz, pastda tahrirlash oynasi ochiladi.", ru: "Включайте и выключайте каждое сообщение. Нажмите — снизу откроется редактор." },
    },
    {
      target: "admin-editor",
      badge: "action",
      title: { uz: "Matn va tugmalar", ru: "Текст и кнопки" },
      text: { uz: "UZ/RU matn, tugmalar va Telegram ko'rinishi. «Menga sinov yuborish» bilan tekshiring.", ru: "Текст UZ/RU, кнопки и вид в Telegram. Проверьте кнопкой «Отправить мне тест»." },
    },
  ],
};

/** Sahifa manzilidan darslik kaliti. */
export function tourKey(path: string): string | null {
  if (path === "/matches") return "matches";
  if (path.startsWith("/matches/")) return "match";
  if (path.startsWith("/clips")) return "clips";
  if (path.startsWith("/stats")) return "stats";
  if (path.startsWith("/records")) return "records";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/admin/notifications")) return "admin";
  return null;
}
