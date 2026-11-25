#!/usr/bin/env python3
"""Regenerate Rucord icons. Development dependencies: Pillow and aggdraw."""
from PIL import Image, ImageDraw
from pathlib import Path
import aggdraw, hashlib, re, json, struct
root=Path(__file__).resolve().parents[1]
# One flat R, with a speech-bubble tail. Coordinates shared by SVG and raster rendering.
commands=[('M',(64,56)),('C',(64,51.6,67.6,48,72,48)),('L',(136,48)),('C',(162.5,48,184,69.5,184,96)),('C',(184,117,170.5,135,151,142)),('L',(192,196)),('L',(158,196)),('L',(118,148)),('L',(96,148)),('L',(96,184)),('L',(64,208)),('Z',())]
inner=[('M',(96,80)),('L',(96,116)),('L',(136,116)),('C',(146,116,152,108,152,98)),('C',(152,88,146,80,136,80)),('Z',())]
def svgpath(cs):return ' '.join(c+' '+ ' '.join(map(str,vs)) for c,vs in cs)
path=svgpath(commands)+' '+svgpath(inner)
mark=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="64 48 128 160"><path fill="#fff" fill-rule="evenodd" d="{path}"/></svg>\n'
full=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="#2563eb"/><path fill="#fff" fill-rule="evenodd" d="{path}"/></svg>\n'
for n,s in [('rucord.svg',full),('rucord-flat.svg',full),('rucord-mark.svg',mark)]: (root/'assets/brand'/n).write_text(s, encoding="utf-8", newline="")
def shape(size,colour='white',plate=True,trim=False):
    scale=4
    w,h=(128,160) if trim else (256,256)
    factor=size/max(w,h)*scale
    im=Image.new('RGBA',(round(w*factor),round(h*factor)))
    if plate:ImageDraw.Draw(im).rounded_rectangle((0,0,im.width-1,im.height-1),radius=56*factor,fill='#2563eb')
    for cs,fill in [(commands,colour),(inner,'#2563eb' if plate else (0,0,0,0))]:
        mask=Image.new('L',im.size);ctx=aggdraw.Draw(mask);p=aggdraw.Path()
        for c,vs in cs:
            v=[(x-(64 if trim and i%2==0 else 48 if trim else 0))*factor for i,x in enumerate(vs)]
            {'M':p.moveto,'C':p.curveto,'L':p.lineto,'Z':p.close}[c](*v)
        ctx.path(p,aggdraw.Brush(255));ctx.flush()
        im.paste(fill,(0,0),mask)
    return im.resize((round(w*size/max(w,h)),round(h*size/max(w,h))),Image.Resampling.LANCZOS)
master=shape(1024);master.save(root/'assets/brand/rucord-1024.png')
shape(72,colour='black',plate=False,trim=True).save(root/'assets/brand/rucord-tray.png')
shape(256).save(root/'packaging/windows/rucord.png')
master.save(root/'packaging/windows/Rucord.ico',sizes=[(n,n) for n in [16,24,32,48,64,128,256]])
master.save(root/'packaging/macos/Rucord.icns',format='ICNS')
for p in (root/'packaging/linux/hicolor').rglob('rucord.png'):
    n=int(p.parts[-3].split('x')[0]);shape(n).save(p)
(root/'packaging/linux/hicolor/scalable/apps/rucord.svg').write_text(full, encoding="utf-8", newline="")
(root/'packaging/linux/hicolor/scalable/apps/rucord-symbolic.svg').write_text(mark.replace('#fff','currentColor'), encoding='utf-8', newline='')
atlaspath=root/'assets/icons/atlas.png';atlas=Image.open(atlaspath).convert('RGBA');x,y=(58%8*64,58//8*64);atlas.paste((0,0,0,0),(x,y,x+64,y+64));glyph=shape(56,plate=False,trim=True);atlas.alpha_composite(glyph,(x+(64-glyph.width)//2,y+4));atlas.save(atlaspath)
p=root/'tools/generate-icons.py';s=p.read_text(encoding="utf-8");s=re.sub(r'("rucord-mark", BRAND_MARK, ")[a-f0-9]+',lambda m:m[1]+hashlib.sha256((root/'assets/brand/rucord-mark.svg').read_bytes()).hexdigest(),s);p.write_text(s, encoding="utf-8", newline="")
icon=root/'packaging/macos/Rucord.icon';assets=icon/'Assets';(assets/'rucord-mark.svg').write_text(mark, encoding="utf-8", newline="")
for p in assets.glob('*wave.svg'):p.unlink(missing_ok=True)
(assets/'01-bubble-body.svg').unlink(missing_ok=True)
(icon/'icon.json').write_text(json.dumps({'fill':{'solid':'srgb:0.14510,0.38824,0.92157,1.00000'},'groups':[{'layers':[{'image-name':'rucord-mark.svg','name':'Rucord','fill':{'solid':'srgb:1.00000,1.00000,1.00000,1.00000'}}]}],'supported-platforms':{'squares':['macOS']}},indent=2)+'\n', encoding='utf-8', newline='')
(root/'assets/brand/README.md').write_text('''# Rucord brand\n\nOriginal minimalist R monogram with a speech-bubble tail. Flat azure #2563eb plate, white mark; no fonts or third-party marks.\n\n- `rucord.svg`: master vector, 256×256.\n- `rucord-flat.svg`: identical flat variant.\n- `rucord-mark.svg`: white monochrome silhouette, trimmed for the atlas.\n- `rucord-1024.png`: large raster preview.\n- `rucord-tray.png`: black transparent template for macOS.\n\nPlatform icons in `packaging/` and atlas cell 58 share this artwork. `tools/generate-icons.py` pins the SVG hash. Original project attribution remains in LICENSE-MIT and THIRD_PARTY_NOTICES.md.\n\nRegenerate with `python -X utf8 tools/generate-brand.py` (Pillow and aggdraw).\n''', encoding='utf-8', newline='')
p=root/'docs/design.md';s=p.read_text(encoding="utf-8").replace('Rucord chat-wave','Rucord R monogram with a speech-bubble tail');p.write_text(s, encoding="utf-8", newline="")
p=root/'assets/icons/README.md';p.write_text(p.read_text(encoding="utf-8").replace('Rucord chat-wave','Rucord R monogram'), encoding='utf-8', newline='')
print('Generated SVG, PNG, ICO, ICNS, Linux sizes, macOS layers and atlas cell.')
