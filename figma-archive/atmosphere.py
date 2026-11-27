"""Prepare the transparent machine and compare the two studio lighting treatments."""
import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).parent
original = Image.open(ROOT / "terminal-source.png").convert("RGB").resize((1024, 1024))
silhouette = [
    (44, 392), (48, 377), (109, 321), (108, 89), (111, 81), (129, 74),
    (129, 33), (137, 23), (210, 15), (216, 21), (216, 65), (373, 57),
    (388, 61), (432, 76), (436, 91), (435, 109), (442, 115), (446, 131),
    (440, 151), (436, 155), (435, 236), (444, 240), (454, 265), (477, 309),
    (487, 350), (489, 386), (478, 411), (465, 418), (446, 414), (436, 399),
    (430, 417), (390, 434), (346, 455), (342, 467), (330, 476), (304, 476),
    (288, 462), (111, 437), (96, 449), (67, 447), (54, 438), (54, 430),
    (45, 425),
]
mask = Image.new("L", original.size)
draw = ImageDraw.Draw(mask)
draw.polygon([(x*2, y*2) for x, y in silhouette], fill=255)
draw.polygon([(x*2, y*2) for x, y in [(441, 274), (451, 297), (470, 350),
             (478, 385), (470, 400), (455, 398), (447, 379)]], fill=0)
machine = original.copy()
machine.putalpha(mask.filter(ImageFilter.GaussianBlur(2.1)))


def lighting(w, h, project, phase):
    y, x = np.mgrid[0:h, 0:w]
    x = x / w
    y = y / h
    wave = np.sin(phase * 2 * np.pi)
    level = (1 - np.cos(phase * 2 * np.pi)) / 2
    rgb = np.broadcast_to([232., 232, 230], (h, w, 3)).copy()

    def patch(cx, cy, width, height, tint, opacity, slope=0):
        strength = opacity * np.exp(-((x-cx)/width)**2-((y-cy-slope*(x-cx))/height)**2)
        rgb[:] += (np.array(tint)-rgb)*strength[..., None]

    if project == 0:
        patch(.65, .40, .34, .30, [162, 187, 203], .35)
        patch(.68+wave*.028, .72+wave*.02, .34, .018, [122, 166, 191], .48, -.15)
        for sign in (-1, 1):
            patch(.70, .68+sign*.047*(1-level), .27, .021, [169, 205, 224], .46, -.18)
        patch(.70, .68, .25, .012, [252, 255, 255], .65*level, -.18)
    else:
        patch(.29, .37, .36, .34, [255, 215, 147], .47)
        for j in range(3):
            patch(.40, .69+(j-1)*(.070-.049*level), .34, .027+.018*level,
                  [206, 92, 55], .23, .17-(j*.08))
    patch(.51, .77, .25, .043, [98, 91, 80] if project else [82, 97, 111], .22)
    patch(.51, .77, .14, .016, [53, 54, 55], .50)
    return Image.fromarray(np.uint8(np.clip(rgb, 0, 255)))


def png_data(image):
    out = io.BytesIO()
    image.save(out, format="PNG", optimize=True)
    return base64.b64encode(out.getvalue()).decode()


if __name__ == "__main__":
    (ROOT / "studio-atmosphere" / "assets.html").write_text(
        json.dumps({"machine": png_data(machine)}, separators=(",", ":")), encoding="ascii")
    proof = Image.new("RGB", (1200, 720))
    for p in (0, 1):
        for i in (0, 1):
            stage = lighting(600, 360, p, i/2)
            sprite = machine.resize((297, 297), Image.Resampling.LANCZOS)
            stage.paste(sprite, (151, 12), sprite)
            proof.paste(stage, (p*600, i*360))
    proof.save(ROOT / "studio-atmosphere" / "lighting-proof.jpg", quality=94)
