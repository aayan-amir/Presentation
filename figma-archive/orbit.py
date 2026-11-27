"""Render the terminal orbit from a textured solid; camera positions are shared by both projects."""
from pathlib import Path
import base64
import io
import json
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).parent
SIDE = 540
SOURCE = Image.open(ROOT / "terminal-source.png").convert("RGB").resize((512,512))
ART = json.loads((ROOT / "artwork.html").read_text())
FRONT = [(108,78),(387,59),(393,338),(109,323)]
DECK = [(110,324),(392,339),(348,420),(46,391)]
RIGHT = [(388,61),(435,78),(434,397),(392,337)]


def warp_matrix(dst, src):
    rows, values = [], []
    for (x,y),(u,v) in zip(dst,src):
        rows.extend([[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]])
        values.extend([u,v])
    return np.linalg.solve(rows,values)


def transfer(destination, texture, polygon, uv):
    x0,y0=np.floor(np.min(polygon,axis=0)).astype(int)
    x1,y1=np.ceil(np.max(polygon,axis=0)).astype(int)
    if x1<=x0 or y1<=y0: return
    local=np.array(polygon)-[x0,y0]
    if abs(np.cross(local[1]-local[0],local[3]-local[0]))<1: return
    transform=warp_matrix(local,uv)
    patch=texture.transform((x1-x0+1,y1-y0+1),Image.Transform.PERSPECTIVE,transform,Image.Resampling.BICUBIC)
    mask=Image.new("L",patch.size);ImageDraw.Draw(mask).polygon([tuple(p) for p in local],fill=255)
    destination.paste(patch,(x0,y0),mask)


def material(rgb):
    rng=np.random.default_rng(36)
    yy,xx=np.mgrid[0:320,0:360]
    noise=rng.normal(0,1.8,xx.shape)+(1-yy/320)*10
    return Image.fromarray(np.clip(noise[:,:,None]+rgb,0,255).astype("uint8"))


def panel(kind):
    out=material([158,156,149]);d=ImageDraw.Draw(out)
    for x in [14,344]:
        for y in [13,307]:
            d.ellipse((x-4,y-4,x+4,y+4),fill="#676967",outline="#bfc1ba")
            d.line((x-2,y+1,x+2,y-1),fill="#303531")
    if kind=="back":
        d.rounded_rectangle((30,30,330,238),radius=8,outline="#7c7d77",width=2)
        for row in range(8):
            for col in range(3):
                x,y=49+col*91,54+row*12
                d.rounded_rectangle((x,y,x+70,y+4),2,fill="#414540")
        d.rectangle((55,181,190,211),fill="#d4d0bb")
        d.text((62,186),"INDEX WORKS  /  CRT-02",fill="#393c34")
        d.rectangle((215,255,242,273),fill="#323832")
        d.rectangle((252,255,280,273),fill="#323832")
    else:
        for i in range(12): d.rounded_rectangle((58+i*19,75,63+i*19,192),2,fill="#51534e")
    return out


class Terminal:
    def __init__(self,project):
        self.faces=[]
        self.loops=[]
        front=SOURCE.copy()
        art=Image.open(io.BytesIO(base64.b64decode(ART[project]))).convert("RGB")
        display=[(153,109),(347,105),(347,286),(151,280)]
        insert=front.copy()
        transfer(insert,art,display,[(100,0),(1000,0),(1000,840),(100,840)])
        mask=Image.new("L",(512,512));ImageDraw.Draw(mask).rounded_rectangle((150,105,348,287),radius=18,fill=248)
        front.paste(insert,(0,0),mask.filter(ImageFilter.GaussianBlur(1)))
        metal=material([164,160,153]);black=material([48,53,52])
        def plane(points,img,uv=None):
            w,h=img.size
            self.faces.append((np.array(points),img,uv or [(0,0),(w-1,0),(w-1,h-1),(0,h-1)]))
        def solid(x0,x1,y0,y1,z0,z1,front_tex,other,front_uv=None):
            plane([(x0,y1,z1),(x1,y1,z1),(x1,y0,z1),(x0,y0,z1)],front_tex,front_uv)
            plane([(x1,y1,z0),(x0,y1,z0),(x0,y0,z0),(x1,y0,z0)],other)
            plane([(x0,y1,z0),(x1,y1,z0),(x1,y1,z1),(x0,y1,z1)],other)
            for x in (x0,x1): plane([(x,y1,z1),(x,y1,z0),(x,y0,z0),(x,y0,z1)],other)
        # Upright casting, a sloped front deck, and the thick lower lip.
        w=1.24; yf=0.79;top=2.97;zf=.06;zb=-.94
        plane([(-w,top,zf),(w,top,zf),(w,yf,zf),(-w,yf,zf)],front,FRONT)
        plane([(w,top,zb),(-w,top,zb),(-w,.22,zb),(w,.22,zb)],panel("back"))
        plane([(-w,top,zb),(w,top,zb),(w,top,zf),(-w,top,zf)],metal)
        plane([(w,top,zf),(w,top,zb),(w,.22,zb),(w,yf,zf)],SOURCE,RIGHT)
        plane([(-w,top,zb),(-w,top,zf),(-w,yf,zf),(-w,.22,zb)],panel("side"))
        plane([(-w,yf,zf),(w,yf,zf),(w,.49,1.22),(-w,.49,1.22)],SOURCE,DECK)
        plane([(-w,.49,1.22),(w,.49,1.22),(w,.19,1.22),(-w,.19,1.22)],SOURCE,[(46,392),(347,421),(347,454),(47,426)])
        for x in (-w,w):plane([(x,yf,zf),(x,.49,1.22),(x,.19,1.22),(x,.22,zb)],metal)
        for x in (-.96,.96):
            for z in (-.68,.95):solid(x-.11,x+.11,.04,.22,z-.10,z+.10,black,black)
        solid(-1.0,-.29,2.97,3.29,-.38,-.18,SOURCE,material([173,82,26]),[(131,30),(213,21),(215,64),(131,73)])
        # Four anchor points keep the braided wrist loop attached to the right casting.
        t=np.linspace(0,2*np.pi,53)
        self.loops=np.stack([1.285+.14*(1-np.cos(t)),1.65-.56*(1-np.cos(t)),.04+.14*np.sin(t)],axis=1)

    def render(self,phase):
        theta=.38+2*np.pi*(phase-np.sin(2*np.pi*phase)/(2*np.pi))
        elev=.18+.17*np.sin(np.pi*phase)**2
        eye=np.array([np.sin(theta)*np.cos(elev),np.sin(elev),np.cos(theta)*np.cos(elev)])
        right=np.array([np.cos(theta),0,-np.sin(theta)]);up=np.cross(eye,right)
        center=np.array([0,1.59,.09]);distance=9.6
        def project(points):
            v=points-center;scale=SIDE*1.95/(distance-v@eye)
            return np.stack([SIDE*.5+(v@right)*scale,SIDE*.51-(v@up)*scale],axis=1)
        canvas=Image.new("RGB",(SIDE,SIDE),(232,232,230))
        floor=Image.new("L",canvas.size)
        fp=project(np.array([[-1.25,.03,-.97],[1.25,.03,-.97],[1.25,.03,1.23],[-1.25,.03,1.23]]))
        ImageDraw.Draw(floor).polygon([tuple(p) for p in fp],fill=130)
        canvas.paste((76,77,73),(0,0,SIDE,SIDE),floor.filter(ImageFilter.GaussianBlur(12)))
        drawables=[((v-center).mean(axis=0)@eye,"face",(v,tex,uv)) for v,tex,uv in self.faces]
        for a,b in zip(self.loops,self.loops[1:]):drawables.append((((a+b)*.5-center)@eye,"cord",(a,b)))
        for _,kind,data in sorted(drawables,key=lambda o:o[0]):
            if kind=="face":
                v,tex,uv=data;transfer(canvas,tex,project(v),uv)
            else:
                pts=[tuple(x) for x in project(np.array(data))]
                ImageDraw.Draw(canvas).line(pts,fill="#173762",width=4)
        return canvas


if __name__=="__main__":
    for project in ["signal1","matter2"]:
        model=Terminal(project)
        frames=[model.render(i/95) for i in range(96)]
        frames[0].save(ROOT/(project+"-orbit.gif"),save_all=True,append_images=frames[1:],duration=50,disposal=1,optimize=True)
