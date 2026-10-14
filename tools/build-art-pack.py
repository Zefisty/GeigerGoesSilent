"""Slice original generated art atlases into optimized local game assets.
Requires Pillow only at build time; does not regenerate or redesign images.
Pass the source atlas paths explicitly; originals stay outside the runtime pack.
"""
from pathlib import Path
from PIL import Image, ImageOps
import argparse, json, hashlib
ROOT=Path(__file__).resolve().parents[1]
PACKS={
 'locations':('locations',4,4,(384,256),'village cordon scrapyard dark-valley agro checkpoint railway red-forest tunnel laboratory camp anomaly ruins industrial swamp reactor'.split()),
 'events':('events',4,4,(384,256),'campfire stash medical-crate anomaly tracks ambush passage abandoned-camp battlefield wounded radio documents artifact trader workshop night-signal'.split()),
 'portraits':('portraits',4,4,(160,160),'rookie soldier technician hunter scavenger medic trader mechanic veteran researcher radio stranger defender scout biologist pig-bandit'.split()),
 'enemies':('enemies',4,4,(160,160),'feral-dog blind-hound boar alpha-boar bloodsucker snork controller giant anomalous-dog leech lurker electro-snork bandit soldier merc sentinel'.split()),
 'items':('items',8,8,(64,64),'pistol pistol-heavy rifle smg sniper shotgun sawedoff knife armor-light armor-vest armor-suit armor-exo helmet gas-mask backpack detector medkit bandage antirad pills canned ration water energy-drink ammo-pistol ammo-rifle ammo-shells mutant-parts tools parts electronics wires artifact-medusa artifact-stoneflower artifact-spark artifact-shell artifact-nightstar artifact-needle artifact-moonlight artifact-meatchunk artifact-gravi artifact-goldfish artifact-flash artifact-fireball artifact-bubble artifact-beads artifact-battery artifact-soul quest-document map journal rare-box sample valuables detector-pro military-pack food medical artifact-rare artifact-dark radio key fuse salvage'.split()),
 'special':(None,4,4,(160,160),'rat-swarm reed-crawler quarry-dog ash-walker mirror-stalker elite-boar armored-bandit snork-veteran gromova orlov motyl rada zhdan serov dron veres'.split())
}
parser=argparse.ArgumentParser()
for key in PACKS:parser.add_argument('--'+key,type=Path)
args=parser.parse_args()
manifest_path=ROOT/'assets/art/catalog.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'version':1,'generatedWith':'OpenAI built-in image_gen; original pixel art','assets':{},'sources':{}}
for key,(folder,cols,rows,size,names) in PACKS.items():
 source=getattr(args,key)
 if not source:continue
 with Image.open(source) as atlas:
  atlas=atlas.convert('RGB');w,h=atlas.size
  assert len(names)==cols*rows
  for i,name in enumerate(names):
   target_folder=folder or ('enemies' if i<8 else 'portraits')
   x,y=i%cols,i//cols
   # Trim only the atlas cell divider; keep the complete individual composition.
   bounds=(round(x*w/cols)+1,round(y*h/rows)+1,round((x+1)*w/cols)-1,round((y+1)*h/rows)-1)
   tile=ImageOps.fit(atlas.crop(bounds),size,method=Image.Resampling.NEAREST)
   tile=tile.quantize(colors=64 if key=='items' else 112,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
   relative=f'assets/art/{target_folder}/{name}.png'
   destination=ROOT/relative;destination.parent.mkdir(parents=True,exist_ok=True)
   tile.save(destination,optimize=True)
   data=destination.read_bytes()
   manifest['assets'][relative]={'width':size[0],'height':size[1],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
  manifest['sources'][key]={'atlas':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'grid':[cols,rows],'names':names}
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f"{len(manifest['assets'])} PNG assets, {sum(a['bytes'] for a in manifest['assets'].values())} bytes")
