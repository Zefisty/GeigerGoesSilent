"""Rebuild application PNGs from the existing SVG master; Pillow is build-time only."""
from pathlib import Path
import hashlib
import json
import math
import re
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MASTER = 'design/zonerpg-radiation-green.svg'
svg = ET.fromstring((ROOT / MASTER).read_bytes())
ns = {'s': 'http://www.w3.org/2000/svg'}
background = svg.find('s:rect', ns).attrib['fill']
group = svg.find('s:g', ns)
symbol = group.attrib['fill']
circles = svg.findall('s:circle', ns)
# Read the existing master's sector geometry instead of maintaining a second design.
sectors = []
for element in group:
    values = [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', element.attrib['d'])]
    cx, cy, x1, y1, rx, ry, rotation, large, sweep, x2, y2 = values
    assert rx == ry and rotation == large == 0 and sweep == 1
    start = round(math.degrees(math.atan2(y1-cy, x1-cx)) % 360, 4)
    end = round(math.degrees(math.atan2(y2-cy, x2-cx)) % 360, 4)
    sectors.append((cx, cy, rx, start, start + (end-start) % 360))

audit = {'source': MASTER, 'sourceSHA256': hashlib.sha256((ROOT / MASTER).read_text(encoding='utf-8').encode('utf-8')).hexdigest(), 'icons': {}}
for name, size in [('192',192), ('512',512), ('apple-180',180),
                   ('favicon-32',32), ('favicon-48',48), ('maskable-512',512)]:
    scale = size * 8 / 512
    image = Image.new('RGB', (size*8, size*8), background)
    draw = ImageDraw.Draw(image)
    def box(cx, cy, radius):
        return tuple(v*scale for v in (cx-radius, cy-radius, cx+radius, cy+radius))
    for cx, cy, radius, start, end in sectors:
        draw.pieslice(box(cx, cy, radius), start, end, fill=symbol)
    for circle in circles:
        a = circle.attrib
        draw.ellipse(box(float(a['cx']), float(a['cy']), float(a['r'])), fill=a['fill'])
    relative = f'assets/pwa/radiation-green-v2-{name}.png'
    target = ROOT / relative
    image.resize((size,size), Image.Resampling.BOX).save(target, optimize=True)
    data = target.read_bytes()
    audit['icons'][relative] = {'size': size, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
(ROOT / 'design/green-icon-assets.json').write_text(json.dumps(audit, indent=2) + '\n', encoding='utf-8')
