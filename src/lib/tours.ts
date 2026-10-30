// Darsliklar: har bir oyna uchun qadamlar. target — sahifadagi data-tour="..." elementi;
// bo'lmasa qadam ekran o'rtasida chiqadi. Sahifada yo'q elementlar (masalan, bo'sh ro'yxat) o'tkazib yuboriladi.
// Matnlar ikki tilda (darslik oynasida UZ/RU almashadi).
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

const s = (target: string | undefined, badge: TourBadge | undefined, title: [string, string], text: [string, string]): TourStep => ({
  target,
  badge,
  title: { uz: title[0], ru: title[1] },
  text: { uz: text[0], ru: text[1] },
});

const NAV: TourStep[] = [
  s("nav-clips", "watch", ["Kliplar", "Клипы"], [
    "Siz tanlagan killardan tayyorlangan videolar shu bo'limda turadi. Har bir klipni ko'rish, MP4 qilib yuklab olish yoki Telegram'ga yuborish mumkin. Yuklab olganingizda nusxasi Telegram'ga ham boradi.",
    "Здесь хранятся видео из выбранных вами убийств. Каждый клип можно посмотреть, скачать в MP4 или отправить в Telegram. При скачивании копия уходит и в Telegram.",
  ]),
  s("nav-stats", "watch", ["Statistika", "Статистика"], [
    "Umumiy ko'rsatkichlaringiz: nechta o'yin, g'alaba foizi, K/D (o'ldirish va o'lish nisbati), headshot foizi va har bir xaritadagi natijangiz. Faqat tahlil qilingan o'yinlar hisoblanadi.",
    "Ваши общие показатели: количество матчей, процент побед, K/D (соотношение убийств и смертей), процент хедшотов и результаты по картам. Учитываются только проанализированные матчи.",
  ]),
  s("nav-menu", "action", ["Menyu", "Меню"], [
    "Bu yerda profilingiz, rekordlaringiz (aylanib turadigan kartalar), Telegram'ni ulash, Sozlamalar, til va tungi rejim bor. Telegram'ni ulasangiz, yangi o'yin va tayyor kliplar haqida xabar keladi.",
    "Здесь ваш профиль, рекорды (сменяющиеся карточки), подключение Telegram, настройки, язык и ночной режим. Подключите Telegram — будут приходить уведомления о новых матчах и готовых клипах.",
  ]),
  s("bell", "watch", ["Bildirishnomalar", "Уведомления"], [
    "Qo'ng'iroqcha — ilova ichidagi xabarlar: yangi o'yin qo'shildi, demo tahlil qilindi, klip tayyor, demo muddati tugayapti. Qizil nuqta o'qilmagan xabar borligini bildiradi. Xabarni bossangiz, kerakli oyna ochiladi.",
    "Колокольчик — сообщения внутри приложения: добавлен матч, демо проанализировано, клип готов, срок демо истекает. Красная точка — есть непрочитанное. Нажмите на сообщение — откроется нужное окно.",
  ]),
  s("help", "optional", ["Tushunmasangiz — shu tugma", "Если непонятно — эта кнопка"], [
    "Har bir oynaning tepasida ? tugmasi bor. Biror narsa tushunarsiz bo'lsa, uni bosing — o'sha oynaning darsligi boshidan ko'rsatiladi.",
    "Кнопка ? есть вверху каждого окна. Если что-то непонятно — нажмите, и урок этого окна покажется с начала.",
  ]),
];

export const TOURS: Record<string, TourStep[]> = {
  matches: [
    s(undefined, undefined, ["ACE'ga xush kelibsiz!", "Добро пожаловать в ACE!"], [
      "ACE — CS2 o'yinlaringizni tahlil qiladigan ilova. U har bir o'yindagi hisobni, raundlarni va barcha killarni ko'rsatadi, eng zo'r killaringizdan esa video klip tayyorlaydi. Qisqa tanishtiruv bir-ikki daqiqa oladi.",
      "ACE — приложение для разбора ваших матчей CS2. Показывает счёт, раунды и все убийства каждого матча, а из лучших убийств делает видеоклипы. Короткое знакомство займёт минуту-две.",
    ]),
    { legend: true, title: { uz: "Uch xil belgi", ru: "Три вида значков" } },
    s("sync", "action", ["1-qadam: o'yinlarni olish", "Шаг 1: загрузка матчей"], [
      "«Sinxronlash» tugmasi Steam'dan yangi Premier, Competitive va Wingman o'yinlaringizni oladi. Birinchi marta ishlatishdan oldin Sozlamalar → Match tarixi bo'limida 2 ta kod kiritiladi (u yerda qadamma-qadam yozilgan). Keyin har safar shu tugmani bossangiz kifoya.",
      "Кнопка «Синхронизация» забирает из Steam ваши новые матчи Premier, Competitive и Wingman. Перед первым использованием в Настройки → История матчей вводятся 2 кода (там всё расписано по шагам). Дальше достаточно нажимать эту кнопку.",
    ]),
    s("upload", "optional", ["Demo faylni o'zingiz yuklash", "Загрузить демо самому"], [
      "FACEIT, turnir yoki Casual o'yin bo'lsa, ular avtomatik kelmaydi — .dem faylni shu tugma orqali yuklang (50 MB gacha, .dem.bz2 ham bo'ladi). Yuklangach fayl navbatga turadi va server uni tahlil qiladi: killar, raundlar va hisob o'zi chiqadi.",
      "Матчи FACEIT, турниров или Casual не приходят автоматически — загрузите .dem через эту кнопку (до 50 МБ, можно .dem.bz2). После загрузки файл встаёт в очередь, сервер его разбирает: убийства, раунды и счёт появятся сами.",
    ]),
    s("demo-tabs", "watch", ["Yuklangan va yuklanmagan", "Загруженные и нет"], [
      "«Yuklangan» — demosi tahlil qilingan o'yinlar: ularda hisob jadvali, raundlar va killar bor, klip ham shulardan qilinadi. «Yuklanmagan» — o'yin ro'yxatda bor, lekin demo hali olinmagan yoki muddati o'tgan. Raqamlar har biridagi o'yinlar soni.",
      "«Загруженные» — матчи с проанализированным демо: в них есть таблица, раунды и убийства, клипы делаются из них. «Не загруженные» — матч в списке есть, но демо ещё не получено или устарело. Цифры — количество матчей.",
    ]),
    s("modes", "optional", ["Rejim bo'yicha saralash", "Фильтр по режиму"], [
      "Premier, Competitive, Wingman yoki Komuniti o'yinlarini alohida ko'rish uchun kerakli rejimni bosing. Yana bir marta bossangiz, filtr o'chadi. Yonidagi raqam — shu rejimdagi o'yinlar soni.",
      "Нажмите режим, чтобы смотреть отдельно Premier, Competitive, Wingman или Комьюнити. Повторное нажатие снимает фильтр. Число рядом — количество матчей в режиме.",
    ]),
    s("map-select", "optional", ["Xarita bo'yicha saralash", "Фильтр по карте"], [
      "Faqat bitta xaritadagi o'yinlarni ko'rmoqchi bo'lsangiz (masalan, Mirage), shu yerdan tanlang. Ro'yxatda faqat siz o'ynagan xaritalar chiqadi.",
      "Чтобы видеть матчи только на одной карте (например, Mirage), выберите её здесь. В списке только карты, на которых вы играли.",
    ]),
    s("day-header", "watch", ["Kunlar bo'yicha", "По дням"], [
      "O'yinlar kunlarga bo'lingan. O'ng tomondagi «W» — o'sha kuni yutgan, «L» — yutqazgan o'yinlaringiz soni.",
      "Матчи сгруппированы по дням. Справа «W» — сколько вы выиграли в тот день, «L» — сколько проиграли.",
    ]),
    s("match-list", "watch", ["O'yin kartasi", "Карточка матча"], [
      "Har bir karta — bitta o'yin. Unda xarita, rejim, vaqt, natija (G'alaba/Mag'lubiyat), hisob va sizning K/D/A'ingiz (kill / o'lim / yordam) yozilgan. Kartani bossangiz, o'yinning to'liq sahifasi ochiladi.",
      "Каждая карточка — один матч: карта, режим, время, итог (Победа/Поражение), счёт и ваш K/D/A (убийства / смерти / помощь). Нажмите на карточку — откроется полная страница матча.",
    ]),
    ...NAV,
  ],
  match: [
    s("match-hero", "watch", ["O'yin natijasi", "Итог матча"], [
      "Tepada asosiy ma'lumot: ikki jamoaning hisobi, xarita, o'yin qancha davom etgani va natija. Agar siz bu o'yinda bo'lsangiz, chap tomon — sizning jamoangiz.",
      "Вверху главное: счёт команд, карта, длительность и итог. Если вы играли в этом матче, слева — ваша команда.",
    ]),
    s("match-actions", "action", ["Video yaratish", "Создание видео"], [
      "«Montaj yaratish» — asosiy tugma: bosganingizda killar ro'yxati ochiladi, kerakli killarni belgilab «Clip yaratish»ni bosasiz va ulardan video tayyorlanadi. «Tez orada» deb yozilganlar (kompilyatsiya, to'liq o'yin, raundni yozish) keyinroq ochiladi.",
      "«Создать монтаж» — главная кнопка: откроется список убийств, отметьте нужные и нажмите «Создать клип» — из них сделают видео. Пункты «скоро» (компиляция, весь матч, запись раунда) откроются позже.",
    ]),
    s("match-tabs", "watch", ["Bo'limlar", "Разделы"], [
      "Hisob jadvali — 10 o'yinchining killari, o'limlari va yordamlari. Raundlar — har raundni kim yutgani (ko'k — siz, qizil — raqib). O'ldirishlar — barcha killar va klip yaratish. Demo — demo holati va yuklab olish.",
      "Таблица — убийства, смерти и помощь 10 игроков. Раунды — кто выиграл каждый раунд (синий — вы, красный — соперник). Убийства — все убийства и создание клипов. Демо — статус и скачивание демо.",
    ]),
    s("match-panel", "watch", ["Tanlangan bo'lim", "Выбранный раздел"], [
      "Shu yerda tanlangan bo'lim ko'rinadi. Hisob jadvalida sizning qatoringiz ajratib ko'rsatiladi. Ma'lumot bo'lmasa, demo hali tahlil qilinmagan — «Demo» bo'limidan yuklashingiz mumkin.",
      "Здесь показан выбранный раздел. В таблице ваша строка выделена. Если данных нет — демо ещё не проанализировано, загрузите его в разделе «Демо».",
    ]),
  ],
  clips: [
    s("clips-sort", "optional", ["Saralash", "Сортировка"], [
      "Kliplarni avval yangilari, avval eskilari yoki nomi bo'yicha tartiblash mumkin. Tanlang va «Saralash»ni bosing.",
      "Клипы можно упорядочить: сначала новые, сначала старые или по названию. Выберите и нажмите «Сортировка».",
    ]),
    s("clip-thumb", "watch", ["Klip holati", "Статус клипа"], [
      "Rasm ustidagi yozuv klip holatini ko'rsatadi. «Render navbatida» — video hali tayyorlanmagan, navbatda turibdi. Tayyor bo'lganda o'ynatish belgisi chiqadi, bossangiz video ochiladi. Tayyor bo'lishi bilan ilovaga va Telegram'ga xabar keladi.",
      "Надпись на картинке — статус клипа. «В очереди на рендер» — видео ещё не готово, ждёт очереди. Когда готово — появится значок воспроизведения, нажмите — откроется видео. О готовности придёт уведомление в приложение и Telegram.",
    ]),
    s("clip-rename", "optional", ["Nomini o'zgartirish", "Переименовать"], [
      "Qalamcha belgisini bosib klipga o'zingiz xohlagan nom bering, masalan «Mirage ace». Nom yuklab olingan faylda ham shunday bo'ladi.",
      "Нажмите на карандаш и дайте клипу своё название, например «Mirage ace». Так же будет называться скачанный файл.",
    ]),
    s("clip-buttons", "action", ["Klip tugmalari", "Кнопки клипа"], [
      "«Ko'rish» — videoni shu yerda ochadi. «MP4 yuklab olish» — telefoningizga saqlaydi (nusxasi Telegram'ga ham boradi). «Telegram» — faqat Telegram'ga yuboradi. «Demoni yuklab olish» — o'yinning demo fayli. Savatcha — klipni o'chiradi. Video tayyor bo'lmaguncha ba'zi tugmalar kulrang turadi.",
      "«Смотреть» — открывает видео здесь. «Скачать MP4» — сохраняет на телефон (копия уходит в Telegram). «Telegram» — отправляет только в Telegram. «Скачать демо» — файл демо матча. Корзина — удаляет клип. Пока видео не готово, часть кнопок серые.",
    ]),
    s("clips-zip", "optional", ["Bir nechtasini birdan", "Сразу несколько"], [
      "Bir nechta klipni bittada yuklamoqchi bo'lsangiz, ularni belgilang (yoki «Tayyorlarini tanlash») va «ZIP yuklab olish»ni bosing. ZIP tayyor bo'lgach yuklab olish tugmasi chiqadi.",
      "Чтобы скачать несколько клипов разом, отметьте их (или «Выбрать готовые») и нажмите «Скачать ZIP». Когда архив будет готов, появится кнопка скачивания.",
    ]),
    s("clips-list", "watch", ["Barcha kliplar", "Все клипы"], [
      "Kliplar o'yin sahifasidagi «Montaj yaratish» orqali qo'shiladi. Klip yo'q bo'lsa, istalgan o'yinni oching va killarni belgilang.",
      "Клипы добавляются через «Создать монтаж» на странице матча. Если клипов нет — откройте любой матч и отметьте убийства.",
    ]),
  ],
  stats: [
    s("stats-profile", "watch", ["Profilingiz", "Ваш профиль"], [
      "Steam nomingiz, rasmingiz va match tarixi ulanganmi-yo'qmi shu yerda ko'rinadi. «Ulanmagan» bo'lsa, Sozlamalar → Match tarixi bo'limida 2 ta kodni kiriting.",
      "Здесь ваше имя и аватар Steam и подключена ли история матчей. Если «не подключена» — введите 2 кода в Настройки → История матчей.",
    ]),
    s("stats-refresh", "action", ["Yangilash", "Обновление"], [
      "Bu tugma Steam'dan yangi o'yinlaringizni oladi, statistika ham shunga qarab yangilanadi.",
      "Эта кнопка забирает из Steam новые матчи, статистика обновится вместе с ними.",
    ]),
    s("stats-grid", "watch", ["Ko'rsatkichlar", "Показатели"], [
      "Matchlar — jami o'yinlar soni. G'alaba — yutgan o'yinlaringiz foizi. K/D — o'ldirgan va o'lgan sonining nisbati (1 dan yuqori — yaxshi). Headshot — killaringizning necha foizi boshga tekkan.",
      "Матчи — всего игр. Победы — процент выигранных. K/D — соотношение убийств и смертей (выше 1 — хорошо). Хедшот — какой процент убийств в голову.",
    ]),
    s("stats-maps", "watch", ["Xaritalar bo'yicha", "По картам"], [
      "Har bir xaritada nechta o'yin o'ynaganingiz, g'alaba foizi va K/D. Qaysi xaritada kuchli, qayerda zaifligingizni shu yerdan ko'rasiz.",
      "Сколько матчей на каждой карте, процент побед и K/D. Видно, где вы сильны, а где нет.",
    ]),
  ],
  callouts: [
    s(undefined, undefined, ["Xarita joy nomlari", "Названия позиций"], [
      "Bu oynada har bir xaritadagi joylarning nomi bor. Jamoa bilan gaplashganda \"qayerda turibdi?\" degan savolga bir so'z bilan javob berish uchun kerak. Nomlar o'yinning o'z xarita ma'lumotidan olingan.",
      "Здесь собраны названия позиций на каждой карте. Нужны, чтобы в игре одним словом сказать команде, где противник. Названия взяты из данных самой игры.",
    ]),
    s("callouts-maps", "action", ["Xaritani tanlang", "Выберите карту"], [
      "Kerakli xaritani bosing: Mirage, Dust II, Inferno, Nuke va boshqalar. Telefonda ro'yxatni chapga surib qolganlarini ko'rasiz.",
      "Нажмите на нужную карту: Mirage, Dust II, Inferno, Nuke и другие. На телефоне листайте ряд влево, чтобы увидеть остальные.",
    ]),
    s("callouts-radar", "action", ["Rangli joyni bosing", "Нажмите на цветную зону"], [
      "Xaritadagi har bir rangli bo'lak — alohida joy. Bossangiz, u oq chiziq bilan ajralib, nomi kattaroq chiqadi va pastda inglizcha hamda ruscha nomi ko'rinadi. Ranglar tomonga qarab: to'q sariq — A, ko'k — B, sariq — o'rta, qizil — T, yashil — CT. \"Nomlar\" tugmasi xaritadagi yozuvlarni yoqadi yoki o'chiradi. Nuke va Vertigo'da yuqori va pastki qavat alohida.",
      "Каждая цветная зона — отдельная позиция. Нажмите — она выделится белой линией, название станет крупнее, а внизу появятся английское и русское названия. Цвета по сторонам: оранжевый — A, синий — B, жёлтый — мид, красный — T, зелёный — CT. Кнопка «Названия» включает и выключает подписи. На Nuke и Vertigo верхний и нижний этажи отдельно.",
    ]),
    s("callouts-search", "optional", ["Qidiruv", "Поиск"], [
      "Nomni bilsangiz, shu yerga yozing: inglizcha (Long, Banana) yoki ruscha (Лонг, Банан) bo'lsa ham topadi. Mos kelmagan joylar xaritada xiralashadi.",
      "Если знаете название, введите его: найдёт и по-английски (Long, Banana), и по-русски (Лонг, Банан). Остальные зоны на карте станут бледными.",
    ]),
    s("callouts-groups", "optional", ["Tomon bo'yicha saralash", "Фильтр по сторонам"], [
      "Faqat A tomoni, B tomoni, o'rta, T yoki CT tomonidagi joylarni ko'rsatadi. Yonidagi raqam — o'sha tomonda nechta joy borligi.",
      "Показывает только позиции стороны A, B, мида, T или CT. Число рядом — сколько там позиций.",
    ]),
    s("callouts-list", "watch", ["Joylar ro'yxati", "Список позиций"], [
      "Hamma joylar tomonlar bo'yicha guruhlangan va alifbo tartibida. Har birida rang (xaritadagi rangi), asosiy nom va ikkinchi nom bor. Nomni bossangiz, xaritada o'sha joy ko'rsatiladi.",
      "Все позиции сгруппированы по сторонам и идут по алфавиту. У каждой — цвет как на карте, основное и второе название. Нажмите на название — позиция подсветится на карте.",
    ]),
  ],
  records: [
    s("records-count", "watch", ["Rekordlar soni", "Количество рекордов"], [
      "Nechta rekord o'rnatilganini ko'rsatadi. Rekordlar faqat siz o'ynagan va tahlil qilingan o'yinlardan hisoblanadi.",
      "Показывает, сколько рекордов установлено. Считаются только проанализированные матчи, где играли вы.",
    ]),
    s("record-card", "watch", ["Rekord kartasi", "Карточка рекорда"], [
      "Har bir karta — bitta shaxsiy rekord: eng ko'p kill, eng ko'p headshot, eng yaxshi K/D, bir raunddagi eng ko'p kill va boshqalar. Pastida rekord qaysi xaritada, qaysi kuni va qanday hisobda o'rnatilgani yozilgan. Kartani bossangiz, o'sha o'yin ochiladi.",
      "Каждая карточка — личный рекорд: больше всего убийств, хедшотов, лучший K/D, больше всего убийств за раунд и другие. Внизу — карта, дата и счёт матча. Нажмите — откроется этот матч.",
    ]),
    s("records-grid", "optional", ["Menyuda ham bor", "Есть и в меню"], [
      "Eng yaxshi rekordlaringiz Menyuning tepasida aylanib turadigan kartalarda ham ko'rinadi. ADR, reyting va klatch rekordlari keyinroq qo'shiladi.",
      "Лучшие рекорды также сменяются на карточках вверху Меню. Рекорды ADR, рейтинга и клатчей добавятся позже.",
    ]),
  ],
  settings: [
    s("settings-profile", "watch", ["Steam profili", "Профиль Steam"], [
      "Siz ilovaga Steam orqali kirgansiz — bu sizning hisobingiz. Parolingiz bizga kelmaydi, faqat Steam ID va nomingiz olinadi.",
      "Вы вошли через Steam — это ваш аккаунт. Пароль к нам не попадает, берутся только Steam ID и имя.",
    ]),
    s("settings-history", "action", ["Match tarixini ulash", "Подключение истории матчей"], [
      "Eng muhim sozlama. Bir marta 2 ta kod kiritasiz — shundan keyin Premier, Competitive va Wingman o'yinlaringiz o'zi keladi, qayta hech narsa kiritish kerak emas.",
      "Самая важная настройка. Один раз вводите 2 кода — и дальше матчи Premier, Competitive и Wingman будут приходить сами, повторно ничего вводить не нужно.",
    ]),
    s("settings-auth", "action", ["1-kod: Authentication Code", "Код 1: Authentication Code"], [
      "Ko'k tugmani bosing — Steam sahifasi ochiladi. U yerda «Access to Your Match History» bo'limidan kodni nusxalang (kod bo'lmasa, «Create Authentication Code»ni bosing). Kod ABCD-EFGHI-JKLM ko'rinishida bo'ladi. Uni shu qutiga joylang. Bu Steam paroli emas — faqat o'yin tarixini o'qishga ruxsat.",
      "Нажмите синюю кнопку — откроется страница Steam. В разделе «Access to Your Match History» скопируйте код (если его нет — нажмите «Create Authentication Code»). Код вида ABCD-EFGHI-JKLM. Вставьте его в поле. Это не пароль Steam — только доступ к истории матчей.",
    ]),
    s("settings-share", "action", ["2-kod: Match Sharing Code", "Код 2: Match Sharing Code"], [
      "CS2'ni oching → Watch → Your Matches. Ro'yxatdan eng eski o'yinni tanlang (oxirgi 28 kun ichida) va pastdagi nusxa olish belgisini bosing. CSGO-… bilan boshlanadigan kodni shu qutiga joylang. Eskisini tanlasangiz, o'shandan keyingi barcha o'yinlar olinadi.",
      "Откройте CS2 → Watch → Your Matches. Выберите самый старый матч (за последние 28 дней) и нажмите значок копирования внизу. Вставьте код, начинающийся с CSGO-…. Чем старше матч, тем больше последующих матчей подтянется.",
    ]),
    s("settings-submit", "action", ["Ulash", "Подключить"], [
      "Ikkala kod kiritilgach, shu tugmani bosing. Kodlar Valve'da tekshiriladi. To'g'ri bo'lsa, tepada «Ulangan» yozuvi chiqadi va o'yinlaringiz yuklana boshlaydi. Xato bo'lsa, nima noto'g'riligi yoziladi.",
      "Когда оба кода введены — нажмите эту кнопку. Коды проверяются у Valve. Если всё верно — вверху появится «Подключено» и начнётся загрузка матчей. Если ошибка — будет написано, что не так.",
    ]),
    s("settings-video", "optional", ["Video va saqlash", "Видео и хранение"], [
      "Klip sifati (720p/1080p/1440p), kadr tezligi (FPS), killdan oldin va keyin necha soniya olinishi hamda demo fayllar necha kun saqlanishini shu yerda tanlaysiz. O'zgartirgach «Saqlash»ni bosing.",
      "Здесь выбирается качество клипа (720p/1080p/1440p), FPS, сколько секунд до и после убийства брать и сколько дней хранить демо. После изменений нажмите «Сохранить».",
    ]),
    s("settings-sessions", "optional", ["Sessiyalar", "Сессии"], [
      "Hisobingizga qaysi qurilmalardan kirilgani. Notanish qurilma bo'lsa, uni shu yerdan chiqarib yuboring.",
      "С каких устройств входили в аккаунт. Если устройство незнакомое — завершите его сессию здесь.",
    ]),
  ],
  admin: [
    s("admin-tabs", "watch", ["Ikki bo'lim", "Два раздела"], [
      "«Bildirishnomalar» — foydalanuvchilarga boradigan xabar shablonlari. «Telegram bot» — botni ulash: BotFather'dan olingan tokenni shu yerga kiritasiz, bot darhol ishlay boshlaydi. Bu oyna faqat sizga ko'rinadi.",
      "«Уведомления» — шаблоны сообщений пользователям. «Telegram бот» — подключение бота: вставьте токен от BotFather, и бот сразу заработает. Это окно видите только вы.",
    ]),
    s("admin-count", "watch", ["Holat", "Состояние"], [
      "Nechta xabar yoqilgani va Telegram bot ulanganmi-yo'qmi. Bot ulanmagan bo'lsa, xabarlar faqat ilova ichida chiqadi.",
      "Сколько сообщений включено и подключён ли бот. Без бота сообщения видны только в приложении.",
    ]),
    s("admin-templates", "action", ["Shablonlar", "Шаблоны"], [
      "Har bir qator — bitta xabar turi (yangi o'yin, klip tayyor va h.k.). O'ngdagi tugma bilan yoqasiz yoki o'chirasiz. Qatorni bossangiz, pastda tahrirlash oynasi ochiladi. Belgilar: havola tugmasi, video, Telegram, ovoz.",
      "Каждая строка — тип сообщения (новый матч, клип готов и т.д.). Переключателем справа включаете или выключаете. Нажмите строку — ниже откроется редактор. Значки: кнопка-ссылка, видео, Telegram, звук.",
    ]),
    s("admin-text", "action", ["Matn", "Текст"], [
      "Xabar sarlavhasi va matnini o'zbek va rus tilida yozing (UZ/RU almashtiring). {map}, {score} kabi o'zgaruvchilar avtomatik haqiqiy qiymat bilan almashadi.",
      "Напишите заголовок и текст на узбекском и русском (переключатель UZ/RU). Переменные вроде {map}, {score} автоматически заменятся реальными значениями.",
    ]),
    s("admin-buttons", "optional", ["Tugmalar", "Кнопки"], [
      "Xabar ostiga 3 tagacha tugma qo'shish mumkin: ilovani ochadigan yoki havolaga olib boradigan.",
      "Под сообщением можно добавить до 3 кнопок: открыть приложение или перейти по ссылке.",
    ]),
    s("admin-preview", "watch", ["Telegram ko'rinishi", "Вид в Telegram"], [
      "Xabar Telegram'da qanday ko'rinishini shu yerda oldindan ko'rasiz.",
      "Здесь заранее видно, как сообщение будет выглядеть в Telegram.",
    ]),
    s("admin-test", "action", ["Sinab ko'rish", "Проверка"], [
      "O'zgarishni «Saqlash» bilan saqlang (saqlaganda hech kimga xabar ketmaydi). «Menga sinov yuborish» xabarni faqat sizga yuboradi — qanday chiqqanini tekshirib ko'ring.",
      "Сохраните кнопкой «Сохранить» (при сохранении никому ничего не отправляется). «Отправить мне тест» шлёт сообщение только вам — проверьте, как оно выглядит.",
    ]),
  ],
};

/** Sahifa manzilidan darslik kaliti. */
export function tourKey(path: string): string | null {
  if (path === "/matches") return "matches";
  if (path.startsWith("/matches/")) return "match";
  if (path.startsWith("/clips")) return "clips";
  if (path.startsWith("/stats")) return "stats";
  if (path.startsWith("/records")) return "records";
  if (path.startsWith("/callouts")) return "callouts";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/admin/notifications")) return "admin";
  return null;
}
