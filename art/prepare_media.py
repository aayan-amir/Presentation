"""Extract the approved lighting and folio studies into web-sized derivatives."""
import base64
import io
import json
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
media=json.loads((root/"figma-archive"/"artwork.html").read_text())
public=root/"public"/"works"
public.mkdir(parents=True,exist_ok=True)
for project,slug in [("signal","signal-field"),("matter","matter-studies")]:
    for i in range(3):
        img=Image.open(io.BytesIO(base64.b64decode(media[project+str(i)])))
        img.save(public/f"{slug}-{i+1}.webp",quality=88)
        img.thumbnail((520,400),Image.Resampling.LANCZOS)
        img.save(public/f"{slug}-{i+1}-small.webp",quality=84)
    preview=Image.open(public/f"{slug}-{2 if project=='signal' else 3}.webp")
    preview.thumbnail((384,384),Image.Resampling.LANCZOS)
    preview.save(public/f"{slug}-crt.webp",quality=86)

cutout=json.loads((root/"figma-archive"/"studio-atmosphere"/"assets.html").read_text())
art=Image.open(io.BytesIO(base64.b64decode(cutout["machine"]))).convert("RGBA")
for slug in ("signal-field","matter-studies"):
    poster=art.copy()
    art_img=Image.open(public/f"{slug}-crt.webp").resize((398,361))
    mask=Image.new("L",art_img.size)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).rounded_rectangle((3,3,395,358),29,fill=255)
    poster.paste(art_img,(300,211),mask)
    poster.thumbnail((800,800),Image.Resampling.LANCZOS)
    poster.save(public/f"{slug}-reference.webp",quality=87)

for source in (root/"review").glob("*-poster.png"):
    if source.stem in {"signal-field-poster","matter-studies-poster"}:
        Image.open(source).save(public/(source.stem+".webp"),quality=90,method=6)
