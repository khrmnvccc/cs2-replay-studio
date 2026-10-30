// Xarita joy nomlari (callouts). Zonalar Valve nav-mesh "place" nomlaridan olingan
// (scripts/callouts/ — qayta yaratish yo'li), rasmlar — rasmiy radar. Bu yerda faqat
// odamga tushunarli nomlar: inglizcha (o'yinchilar umumiy tili) va ruscha (bizda ko'p ishlatiladigan sleng).

export type CalloutGroup = "a" | "b" | "mid" | "t" | "ct";
export type CalloutLevel = "upper" | "lower";
export interface CalloutZone {
  id: string;
  g: CalloutGroup;
  /** radar pikselidagi (1024×1024) ko'pburchaklar: "x,y x,y ..." */
  p: string[];
  /** nom yoziladigan nuqta */
  l: [number, number];
}
export type CalloutMapData = Partial<Record<CalloutLevel, CalloutZone[]>>;

export const CALLOUT_MAPS = ["de_mirage", "de_dust2", "de_inferno", "de_nuke", "de_ancient", "de_anubis", "de_overpass", "de_vertigo", "de_train"] as const;
export type CalloutMap = (typeof CALLOUT_MAPS)[number];
export const RADAR_SIZE = 1024;

export const GROUP_ORDER: CalloutGroup[] = ["a", "b", "mid", "t", "ct"];
export const GROUPS: Record<CalloutGroup, { uz: string; ru: string; hue: number; sat: number }> = {
  a: { uz: "A tomoni", ru: "Сторона A", hue: 24, sat: 88 },
  b: { uz: "B tomoni", ru: "Сторона B", hue: 212, sat: 82 },
  mid: { uz: "O'rta (Mid)", ru: "Мид", hue: 44, sat: 92 },
  t: { uz: "T tomoni", ru: "Сторона T", hue: 352, sat: 74 },
  ct: { uz: "CT tomoni", ru: "Сторона CT", hue: 168, sat: 72 },
};

/** Guruh ichida qo'shni zonalar ajralib tursin: bir xil rang, har xil yorqinlik. */
export function zoneColor(g: CalloutGroup, i: number) {
  const { hue, sat } = GROUPS[g];
  const light = [52, 42, 60, 47, 56, 38][i % 6];
  return `hsl(${(hue + ((i % 3) - 1) * 7 + 360) % 360} ${sat}% ${light}%)`;
}

type N = [en: string, ru: string];
const NAMES: Record<string, N> = {
  Admin: ["Admin", "Админка"],
  Alley: ["Alley", "Аллея"],
  Apartments: ["Apartments", "Апсы"],
  APlatform: ["A Platform", "Платформа A"],
  ARamp: ["A Ramp", "Рампа A"],
  Arch: ["Arch", "Арка"],
  BackAlley: ["Back Alley", "Задняя аллея"],
  BackDoor: ["Back Door", "Задняя дверь"],
  BackHall: ["Back Hall", "Задний зал"],
  BackofA: ["Back of A", "За плентом A"],
  BackofB: ["Back of B", "За плентом B"],
  Balcony: ["Balcony", "Балкон"],
  Banana: ["Banana", "Банан"],
  BDoors: ["B Doors", "Двери B"],
  BombsiteA: ["A Site", "Плент A"],
  BombsiteB: ["B Site", "Плент B"],
  BPlatform: ["B Platform", "Платформа B"],
  Bricks: ["Bricks", "Кирпичи"],
  Bridge: ["Bridge", "Мост"],
  Canal: ["Canal", "Канал"],
  Catwalk: ["Catwalk", "Кэтвок"],
  Connector: ["Connector", "Коннектор"],
  Construction: ["Construction", "Стройка"],
  Control: ["Control Room", "Контрол"],
  Crane: ["Crane", "Кран"],
  CTSideUpper: ["CT Upper", "Верх CT"],
  CTSpawn: ["CT Spawn", "Респ CT"],
  Deck: ["Deck", "Дек"],
  Decon: ["Decon", "Декон"],
  Dumpster: ["Dumpster", "Мусорка"],
  ElectricalBox: ["Electrical Box", "Электробокс"],
  Elevator: ["Elevator", "Лифт"],
  ExtendedA: ["A Extended", "Проход на A"],
  Fountain: ["Fountain", "Фонтан"],
  Garage: ["Garage", "Гараж"],
  Graveyard: ["Graveyard", "Кладбище"],
  Heaven: ["Heaven", "Хевен"],
  Hell: ["Hell", "Хелл"],
  Hole: ["Hole", "Дырка"],
  House: ["House", "Дом"],
  Hut: ["Hut", "Будка"],
  HutRoof: ["Hut Roof", "Крыша будки"],
  Ivy: ["Ivy", "Плющ"],
  Jungle: ["Jungle", "Джунгли"],
  Kitchen: ["Kitchen", "Кухня"],
  Ladder: ["Ladder Room", "Лестница"],
  LadderBottom: ["Ladder Bottom", "Низ лестницы"],
  LadderTop: ["Ladder Top", "Верх лестницы"],
  Library: ["Library", "Библиотека"],
  Lobby: ["Lobby", "Лобби"],
  LockerRoom: ["Locker Room", "Раздевалка"],
  LongA: ["Long A", "Лонг"],
  LongDoors: ["Long Doors", "Двери лонга"],
  LowerMid: ["Lower Mid", "Нижний мид"],
  LowerPark: ["Lower Park", "Нижний парк"],
  LowerTunnel: ["Lower Tunnel", "Нижние туннели"],
  Main: ["Main", "Мейн"],
  MainHall: ["Main Hall", "Главный зал"],
  Mid: ["Mid", "Мид"],
  Middle: ["Mid", "Мид"],
  MidDoors: ["Mid Doors", "Двери мида"],
  Mini: ["Mini", "Мини"],
  Observation: ["Observation", "Обсервейшн"],
  Outside: ["Outside", "Улица"],
  OutsideLong: ["Outside Long", "Выход на лонг"],
  OutsideTunnel: ["Outside Tunnels", "Выход из туннелей"],
  PalaceAlley: ["Palace Alley", "Аллея паласа"],
  PalaceInterior: ["Palace", "Палас"],
  Pipe: ["Pipe", "Труба"],
  Pit: ["Pit", "Яма"],
  Playground: ["Playground", "Площадка"],
  PopDog: ["Pop Dog", "Попдог"],
  Quad: ["Quad", "Квадрат"],
  Rafters: ["Rafters", "Балки"],
  Ramp: ["Ramp", "Рампа"],
  Restroom: ["Restroom", "Туалет"],
  Roof: ["Roof", "Крыша"],
  Ruins: ["Ruins", "Руины"],
  Scaffolding: ["Scaffolding", "Леса"],
  Secret: ["Secret", "Секрет"],
  SecondMid: ["Second Mid", "Второй мид"],
  Shop: ["Shop", "Магазин"],
  Short: ["A Short", "Шорт"],
  ShortStairs: ["Short Stairs", "Лестница шорта"],
  Side: ["Side", "Сайд"],
  SideAlley: ["Side Alley", "Боковая аллея"],
  SideEntrance: ["Side Entrance", "Боковой вход"],
  SideHall: ["Side Hall", "Боковой зал"],
  Silo: ["Silo", "Силос"],
  SnipersNest: ["Sniper's Nest", "Снайперка"],
  Squeaky: ["Squeaky", "Скрипка"],
  Stairs: ["Stairs", "Лестница"],
  StorageRoom: ["Storage Room", "Склад"],
  Street: ["Street", "Улица"],
  TCorridorUp: ["T Corridor", "Коридор T"],
  TicketBooth: ["Ticket Booth", "Касса"],
  TMain: ["T Main", "Мейн T"],
  TopofMid: ["Top Mid", "Верх мида"],
  Trophy: ["Trophy Room", "Трофейная"],
  TRamp: ["T Ramp", "Рампа T"],
  Truck: ["Truck", "Грузовик"],
  TSideLower: ["T Lower", "Низ T"],
  TSideUpper: ["T Upper", "Верх T"],
  TSpawn: ["T Spawn", "Респ T"],
  TStairs: ["T Stairs", "Лестница T"],
  Tunnel: ["Tunnel", "Туннель"],
  Tunnel1: ["Tunnel 1", "Туннель 1"],
  Tunnel2: ["Tunnel 2", "Туннель 2"],
  Tunnels: ["Tunnels", "Туннели"],
  TunnelStairs: ["Tunnel Stairs", "Лестница туннеля"],
  UnderA: ["Under A", "Под A"],
  Underpass: ["Underpass", "Подземка"],
  UpperPark: ["Upper Park", "Верхний парк"],
  UpperTunnel: ["Upper Tunnel", "Верхние туннели"],
  Upstairs: ["Upstairs", "Второй этаж"],
  Vending: ["Vending", "Автоматы"],
  Vents: ["Vents", "Вентиляция"],
  Walkway: ["Walkway", "Проход"],
  Water: ["Water", "Вода"],
};

/** Xaritaga xos, o'yinchilar boshqacha ataydigan joylar. */
const MAP_NAMES: Partial<Record<CalloutMap, Record<string, N>>> = {
  de_mirage: { SnipersNest: ["Window", "Окно"], Shop: ["Market", "Маркет"] },
  de_dust2: { Catwalk: ["Catwalk", "Кэт"] },
  de_inferno: { Apartments: ["Apartments", "Квартиры"] },
};

/** id → [inglizcha, ruscha]. Noma'lum id bo'lsa — CamelCase'ni so'zlarga bo'lamiz. */
export function calloutName(map: CalloutMap, id: string): N {
  const hit = MAP_NAMES[map]?.[id] ?? NAMES[id];
  if (hit) return hit;
  const words = id.replace(/([a-z])([A-Z])/g, "$1 $2");
  return [words, words];
}
