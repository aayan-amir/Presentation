"""Fixed-camera artwork for the six optical and material study states."""
import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).parent
W, H = 1100, 840
Y, X = np.mgrid[0:H, 0:W]
RNG = np.random.default_rng(16)


def unit(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-8)


def paint_mesh(canvas, points, colors, scale, center):
    faces = np.stack([points[:-1, :-1], points[1:, :-1], points[1:, 1:], points[:-1, 1:]], axis=2)
    depth = faces[..., 2].mean(axis=2).ravel()
    xy = faces[..., :2].copy()
    xy[..., 0] = center[0] + scale * xy[..., 0]
    xy[..., 1] = center[1] - scale * xy[..., 1]
    polygons = xy.reshape(-1, 4, 2).astype(int).tolist()
    palette = np.clip(colors, 0, 255).astype("uint8").reshape(-1, 3).tolist()
    draw = ImageDraw.Draw(canvas)
    for idx in depth.argsort():
        draw.polygon([tuple(p) for p in polygons[idx]], fill=tuple(palette[idx]))


def backdrop(rgb, glow, sx, sy):
    light = np.exp(-((X - sx) / 550)**2 - ((Y - sy) / 390)**2)
    noise = RNG.normal(0, .8, (H, W, 1))
    pixels = np.array(rgb) + light[..., None] * np.array(glow) + noise
    return Image.fromarray(np.clip(pixels, 0, 255).astype("uint8"))


def chrome(position):
    canvas = backdrop([4, 9, 12], [17, 31, 35], 570, 530)
    u = np.linspace(0, 1, 410)
    t = -np.pi * .34 + 6.6 * np.pi * u
    radius = .17 + .72 * (1-u)**.72
    curve = np.stack([radius*np.cos(t), 2.65*u-1.33, radius*np.sin(t)], axis=-1)
    tangent = unit(np.gradient(curve, axis=0))
    a = unit(np.cross(tangent, [0, 1, 0]))
    b = unit(np.cross(tangent, a))
    angle = np.linspace(0, 2*np.pi, 48)
    normal = a[:,None]*np.cos(angle)[None,:,None] + b[:,None]*np.sin(angle)[None,:,None]
    points = curve[:,None] + (.085 + .052*(1-u))[:,None,None]*normal
    points[...,1] += .18*points[...,2]
    n = unit(normal[:-1,:-1])
    refl = 2*n[...,2,None]*n - [0,0,1]
    az = np.arctan2(refl[...,0], refl[...,2])
    strip = np.exp(-((az-[-1.25,0,1.25][position])/.42)**2)
    spot = np.exp(-((points[:-1,:-1,0]-[-.52,0,.52][position])/.37)**2)
    rim = np.exp(-((az+1.95)/.45)**2)
    horizon = np.exp(-((refl[...,1]+.16)/.12)**2)
    color = np.array([16,24,30])+strip[...,None]*(.5+1.2*spot[...,None])*[225,238,240]+spot[...,None]*[18,29,34]+rim[...,None]*[27,64,73]+horizon[...,None]*[78,85,91]+np.maximum(refl[...,1,None],0)*[35,46,50]
    draw = ImageDraw.Draw(canvas)
    for y in range(38):
        shade=30+int(30*np.cos(y/38*np.pi))
        draw.ellipse((355,699+y,745,742+y), fill=(shade,shade+9,shade+12))
    draw.ellipse((355,695,745,747), fill=(86,106,112),outline=(167,195,197),width=2)
    paint_mesh(canvas,points,color,220,(550,405))
    return canvas


def acrylic(stage):
    canvas=backdrop([222,211,187],[27,25,28],510,235)
    shadow=Image.new("RGBA",(W,H))
    ImageDraw.Draw(shadow).ellipse((195,612,944,745),fill=(75,36,12,80))
    canvas.paste(shadow.filter(ImageFilter.GaussianBlur(35)),mask=shadow.getchannel("A").filter(ImageFilter.GaussianBlur(35)))
    u,v=np.meshgrid(np.linspace(0,1,177),np.linspace(0,1,85),indexing="ij")
    theta=(u-.5)*[.03,.95,4.65][stage]
    radius=.27+1.3*v
    ridge=np.cos(u*32*np.pi)
    blend=[0,.52,1][stage]
    x=(1-blend)*((u-.5)*2.9)+blend*radius*np.sin(theta)
    y=(1-blend)*((v-.5)*1.56)+blend*(radius*np.cos(theta)-.47)
    z=(.03+.15*blend)*ridge*(.35+.65*v)+.18*blend*np.sin(theta)
    px=x*.94+z*.34; py=y*.78+x*.19+z*.49
    points=np.stack([px,py,z+.29*y-.14*x],axis=-1)
    normals=unit(np.cross(np.gradient(points,axis=0),np.gradient(points,axis=1)))[:-1,:-1]
    gloss=np.abs(normals@unit(np.array([-.5,.18,.85])))**13
    rib=(1+ridge[:-1,:-1])/2
    col=np.array([159,40,8])+rib[...,None]*[66,34,8]+gloss[...,None]*[75,108,57]+v[:-1,:-1,None]*[13,11,3]
    col[(u[:-1,:-1]>.79)&(u[:-1,:-1]<.815)&(v[:-1,:-1]>.91)] = [99,31,18]
    paint_mesh(canvas,points,col,227,(550,397))
    return canvas


def encoded(image, quality=92):
    data=io.BytesIO()
    image.convert("RGB").save(data,"JPEG",quality=quality,optimize=True)
    return base64.b64encode(data.getvalue()).decode()


if __name__=="__main__":
    assets={key+str(i):encoded(fn(i)) for key,fn in [("signal",chrome),("matter",acrylic)] for i in range(3)}
    from os import environ
    reference=Path(environ["USERPROFILE"])/"AppData/Local/Temp/codex-clipboard-61985c60-9100-4208-9624-c4c87fe95027.png"
    if reference.is_file():
        ref=Image.open(reference)
        ref.thumbnail((960,600))
        assets["reference"]=encoded(ref,85)
    (ROOT/"artwork.html").write_text(json.dumps(assets,separators=(",",":")),encoding="ascii")
