import json,os,sys
OUT=sys.argv[1]
z=json.load(open('out/zones.json')); G=json.load(open('out/groups.json'))
OV={
 'de_dust2':{'MidDoors':'mid','UnderA':'a','ShortStairs':'a','LowerTunnel':'b','TunnelStairs':'b','Catwalk':'mid'},
 'de_mirage':{'SnipersNest':'mid','TicketBooth':'a','TRamp':'t'},
 'de_inferno':{'Banana':'b','Apartments':'a','Balcony':'a','BackAlley':'a','Upstairs':'a','TRamp':'t','LowerMid':'mid','Kitchen':'b'},
 'de_vertigo':{'TopofMid':'mid','BackofB':'b'},
}
os.makedirs(OUT,exist_ok=True)
for m,lv in z.items():
    o={}
    for l,zones in lv.items():
        o[l]=[{'id':zn['id'],'g':OV.get(m,{}).get(zn['id'],G[m][zn['id']]),'p':zn['paths'],'l':zn['label']} for zn in zones]
    json.dump(o,open(f'{OUT}/{m}.json','w'),separators=(',',':'))
    os.system(f'cp out/img/{m}*.webp {OUT}/')
