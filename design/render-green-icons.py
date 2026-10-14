"""Rebuild only the flat green application icons (Pillow is a build-time tool)."""
from pathlib import Path
import math
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = '#0e130f'
SYMBOL = '#b6c783'
CENTER, OUTER, INNER, DOT = 256, 178, 68, 28
ANGLES = (240, 0, 120)

def point(radius, angle):
    angle = math.radians(angle)
    return CENTER + radius * math.cos(angle), CENTER + radius * math.sin(angle)

paths = []
for start in ANGLES:
    a, b = point(OUTER, start), point(OUTER, start + 60)
    paths.append(f'<path d="M256 256L{a[0]:.4f} {a[1]:.4f}A178 178 0 0 1 {b[0]:.4f} {b[1]:.4f}Z"/>')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
       f'<rect width="512" height="512" fill="{BACKGROUND}"/>'
       f'<g fill="{SYMBOL}">{"".join(paths)}</g>'
       f'<circle cx="256" cy="256" r="68" fill="{BACKGROUND}"/>'
       f'<circle cx="256" cy="256" r="28" fill="{SYMBOL}"/></svg>\n')
(ROOT / 'design/zonerpg-radiation-green.svg').write_text(svg, encoding='utf-8')

for name, size in [('192',192), ('512',512), ('apple-180',180),
                   ('favicon-32',32), ('favicon-48',48), ('maskable-512',512)]:
    scale = size * 8 / 512
    image = Image.new('RGB', (size*8, size*8), BACKGROUND)
    draw = ImageDraw.Draw(image)
    def box(radius):
        return tuple(v*scale for v in (CENTER-radius,CENTER-radius,CENTER+radius,CENTER+radius))
    for start in ANGLES:
        draw.pieslice(box(OUTER), start, start+60, fill=SYMBOL)
    draw.ellipse(box(INNER), fill=BACKGROUND)
    draw.ellipse(box(DOT), fill=SYMBOL)
    image.resize((size,size), Image.Resampling.BOX).save(
        ROOT / f'assets/pwa/radiation-green-{name}.png', optimize=True)
