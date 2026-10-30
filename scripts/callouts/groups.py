import json,sys,os,math
D=sys.argv[1]; z=json.load(open('out/zones.json'))
G={}
for m,lv in z.items():
    zones={zn['id']:zn for l in lv.values() for zn in l}
    f=f'{D}/nav/place_distance_matrix_{m}.json'
    mat=json.load(open(f)) if os.path.exists(f) else None
    anchors={'a':'BombsiteA','b':'BombsiteB','t':'TSpawn','ct':'CTSpawn','mid':'Middle' if 'Middle' in zones else 'Mid'}
    def dist(p,q):
        if p==q: return 0
        if mat and p in mat and q in mat[p]: return mat[p][q]['geodesic']['median_dist']
        a,b=zones[p]['label'],zones[q]['label']; return math.dist(a,b)*5
    G[m]={}
    for pid in zones:
        best=min(anchors,key=lambda g: dist(pid,anchors[g]) if anchors[g] in zones else 1e9)
        G[m][pid]=best
    print(m, {g:[p for p,v in G[m].items() if v==g] for g in anchors})
json.dump(G,open('out/groups.json','w'))
