"""Render the lesson CRT textures and corresponding poster fallback artwork."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
target = root / "public" / "lesson"
target.mkdir(exist_ok=True)
base = Image.open(root / "public/works/signal-field-poster.webp").convert("RGBA")
items = [
    ("what-is-a-framework", "WEB|FRAMEWORKS", "THE WEB STACK", "#14372f", "#fbda8a"),
    ("languages", "LANGUAGES", "NOW / NEXT", "#182553", "#b8ceff"),
    ("next-js", "NEXT.JS", "SERVER / BROWSER", "#0d1824", "#a8ecdb"),
    ("astro", "ASTRO", "ISLANDS OF CODE", "#402335", "#ffbb91"),
    ("remix-3", "REMIX 3", "REQUEST / RESPONSE", "#292044", "#c9b3ff"),
    ("two-to-watch", "TWO TO|WATCH", "TANSTACK / SVELTEKIT", "#4c2620", "#ffd095"),
    ("usage-and-satisfaction", "USAGE /|SATISFACTION", "STATE OF JS 2025", "#243246", "#c4e9ff"),
    ("pick-a-stack", "PICK A|STACK", "FIND YOUR FIT", "#273c15", "#e7f3bb"),
]
w,h=384,288
bold=ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",52)
small=ImageFont.truetype("C:/Windows/Fonts/consola.ttf",15)
corners=[(219,268),(512,291),(505,525),(224,497)]
points=[(0,0),(w,0),(w,h),(0,h)]
rows, values=[],[]
for (x,y),(u,v) in zip(corners,points):
    rows.extend([[x,y,1,0,0,0,-x*u,-y*u],[0,0,0,x,y,1,-x*v,-y*v]])
    values.extend([u,v])
matrix=np.linalg.solve(rows,values)
mask=Image.new("L",(w,h))
ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),16,fill=255)
mask=mask.transform(base.size,Image.Transform.PERSPECTIVE,matrix,Image.Resampling.BICUBIC)
for i,(slug,title,subtitle,background,ink) in enumerate(items,1):
    image=Image.new("RGB",(w,h),background)
    draw=ImageDraw.Draw(image)
    draw.rectangle((27,28,357,260),outline=ink,width=1)
    draw.text((43,44),f"CRT-02  /  {i:02}",font=small,fill=ink)
    lines=title.split("|")
    for row,line in enumerate(lines):
        font=bold if bold.getlength(line)<300 else ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",42)
        draw.text((42,133+(row-(len(lines)-1)/2)*47),line,font=font,fill=ink,anchor="lm")
    draw.text((43,229),subtitle,font=small,fill=ink)
    draw.ellipse((329,45,339,55),fill=ink)
    image.save(target/f"{slug}-crt.webp",quality=87)
    poster=base.copy()
    poster.paste(image.transform(base.size,Image.Transform.PERSPECTIVE,matrix,Image.Resampling.BICUBIC),(0,0),mask)
    poster.save(target/f"{slug}-poster.webp",quality=90,method=6)

