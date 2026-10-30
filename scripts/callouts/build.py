import csv, json, sys, os
from shapely.geometry import box, Polygon, MultiPolygon
from shapely.ops import unary_union
from PIL import Image
D = sys.argv[1]; OUT = sys.argv[2]
md = json.load(open(D+'/map/map_data.json'))
rows = list(csv.DictReader(open(D+'/nav/nav_info.csv')))
MAPS = ['de_dust2','de_mirage','de_inferno','de_nuke','de_ancient','de_anubis','de_overpass','de_vertigo','de_train']
os.makedirs(OUT+'/img', exist_ok=True)
res = {}
for m in MAPS:
    info = md[m]; px, py, sc = info['pos_x'], info['pos_y'], info['scale']; cut = info.get('z_cutoff')
    levels = {}
    for r in rows:
        if r['mapName'] != m or not r['areaName']: continue
        x1,y1,x2,y2 = (float(r[k]) for k in ('northWestX','northWestY','southEastX','southEastY'))
        z = (float(r['northWestZ'])+float(r['southEastZ']))/2
        lvl = 'lower' if cut is not None and z < cut else 'upper'
        levels.setdefault(lvl, {}).setdefault(r['areaName'], []).append(box(min(x1,x2),min(y1,y2),max(x1,x2),max(y1,y2)))
    out = {}
    for lvl, places in levels.items():
        zones = []
        for name, boxes in places.items():
            g = unary_union([b.buffer(6, join_style=2) for b in boxes]).buffer(-6, join_style=2).simplify(6)
            polys = [g] if isinstance(g, Polygon) else list(getattr(g,'geoms',[]))
            polys = [p for p in polys if p.area > 1500]
            if not polys: continue
            def P(p): return ' '.join(f'{(x-px)/sc:.1f},{(py-y)/sc:.1f}' for x,y in p.exterior.coords[:-1])
            big = max(polys, key=lambda p: p.area); lp = big.representative_point()
            zones.append({'id': name, 'paths': [P(p) for p in polys], 'label': [round((lp.x-px)/sc,1), round((py-lp.y)/sc,1)], 'area': round(sum(p.area for p in polys)/sc/sc)})
        out[lvl] = sorted(zones, key=lambda z: z['id'])
    res[m] = out
    for lvl in out:
        src = D+f'/map/{m}{"_lower" if lvl=="lower" else ""}.png'
        Image.open(src).convert('RGB').save(OUT+f'/img/{m}{"_lower" if lvl=="lower" else ""}.webp', quality=78, method=6)
json.dump(res, open(OUT+'/zones.json','w'), separators=(',',':'))
for m,v in res.items(): print(m, {k: len(z) for k,z in v.items()})
