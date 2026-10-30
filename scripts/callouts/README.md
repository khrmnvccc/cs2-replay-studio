# Xarita joy nomlari ma'lumoti

`public/callouts/<map>.json` va radar rasmlari shu skriptlar bilan yaratilgan.

Manba: `awpy==1.3.1` paketi (`pip download awpy==1.3.1 --no-deps`), ichidagi
`awpy/data/nav/nav_info.csv` (Valve nav-mesh maydonlari va ularning "place" nomlari),
`awpy/data/map/map_data.json` (dunyo → radar koordinatasi) va radar PNG'lari.

```
pip install shapely pillow
python3 build.py <awpy/data> out          # zonalar (bir xil nomli maydonlar birlashtiriladi) + webp
python3 groups.py <awpy/data>             # A/B/Mid/T/CT tomoni — nav masofasi bo'yicha eng yaqin
python3 finalize.py ../../public/callouts # qo'lda tuzatishlar bilan yakuniy fayllar
```

Odamga ko'rinadigan nomlar (inglizcha/ruscha) — `src/lib/callouts.ts`.
