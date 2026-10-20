// Xarita vizuallari: rasm o'rniga o'zimizning gradient "kartochka" uslubi.
// Rasmiy xarita rasmlari Valve mulki; ularni /public/maps/<map>.webp ga qo'yib,
// MAP_IMAGES ga qo'shsangiz kartochkada rasm ishlatiladi.
export interface MapMeta {
  name: string;
  /** asosiy rang (hsl) */
  hue: number;
  image?: string;
}

const MAPS: Record<string, MapMeta> = {
  de_mirage: { name: "Mirage", hue: 38 },
  de_inferno: { name: "Inferno", hue: 18 },
  de_dust2: { name: "Dust II", hue: 44 },
  de_nuke: { name: "Nuke", hue: 200 },
  de_ancient: { name: "Ancient", hue: 140 },
  de_anubis: { name: "Anubis", hue: 170 },
  de_vertigo: { name: "Vertigo", hue: 215 },
  de_overpass: { name: "Overpass", hue: 100 },
  de_train: { name: "Train", hue: 260 },
  cs_office: { name: "Office", hue: 225 },
  cs_italy: { name: "Italy", hue: 28 },
  de_basalt: { name: "Basalt", hue: 10 },
  de_edin: { name: "Edin", hue: 190 },
};

export const MAP_IMAGES: Record<string, string> = {};

export function mapMeta(mapName: string | null | undefined): MapMeta {
  if (!mapName) return { name: "Noma'lum xarita", hue: 270 };
  const known = MAPS[mapName];
  const pretty = mapName.replace(/^(de|cs|ar|dz)_/, "").replace(/_/g, " ");
  return { ...(known ?? { name: pretty.charAt(0).toUpperCase() + pretty.slice(1), hue: 270 }), image: MAP_IMAGES[mapName] };
}

export const KNOWN_MAPS = Object.keys(MAPS);
