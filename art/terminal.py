"""Build the editable Index Works terminal, web model, and reference renders."""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "works"
PUBLIC.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, rgb, roughness=.45, metal=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*rgb, 1)
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metal
    return mat


shell = material("Mineral powder coat", (.57,.545,.48), .36)
deck = material("Warm cast aluminum", (.70,.66,.55), .4)
back = material("Rear graphite aluminum", (.35,.34,.30), .48)
rubber = material("Graphite elastomer", (.035,.041,.047), .72)
glass = material("Smoked phosphor bezel", (.035,.052,.055), .19, .28)
phosphor = material("Replaceable phosphor", (.012,.024,.028), .43)
metal = material("Brushed steel", (.52,.49,.42), .27, .77)
cap_colors = [material("Glacier blue", (.047,.48,.58), .27),
              material("Honey yellow", (.97,.59,.17), .3),
              material("Vermilion", (.86,.14,.065), .26)]
legend = material("Legend ink", (.055,.082,.08))
amber = material("Amber cartridge", (.74,.225,.038), .28)
blue = material("Cobalt braid", (.016,.075,.39), .38)
paper = material("Inspection label", (.78,.72,.59))


def bevel(obj, width, segments=3):
    if not width:
        return
    mod = obj.modifiers.new("Machined edge radius", "BEVEL")
    mod.width = width
    mod.segments = segments
    obj.modifiers.new("Weighted face normals", "WEIGHTED_NORMAL")


def block(name, loc, dimensions, mat, radius=.025, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel(obj,radius)
    obj.parent = parent
    return obj


def cylinder(name, loc, radius, depth, mat, axis="z", count=32, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=count, radius=radius, depth=depth, location=loc)
    obj=bpy.context.object
    obj.name=name
    if axis=="x":
        obj.rotation_euler.y=math.pi/2
    if axis=="y":
        obj.rotation_euler.x=math.pi/2
    obj.data.materials.append(mat)
    obj.parent=parent
    bevel(obj,min(depth*.14,.012),2)
    return obj


def empty(name, loc):
    obj=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(obj)
    obj.location=loc
    return obj


def profile(name, width, side, mat):
    vertices=[(x,y,z) for x in [-width/2,width/2] for y,z in side]
    n=len(side)
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bevel(obj,.065)
    return obj


def label(name, words, loc, size, mat, angle=(math.pi/2,0,0), parent=None):
    bpy.ops.object.text_add(location=loc,rotation=angle)
    obj=bpy.context.object
    obj.name=name
    obj.data.body=words
    obj.data.align_x="CENTER"
    obj.data.align_y="CENTER"
    obj.data.size=size
    obj.data.materials.append(mat)
    bpy.ops.object.convert(target="MESH")
    obj.parent=parent
    return obj


def curve(name, points, thickness, mat):
    data=bpy.data.curves.new(name,"CURVE")
    data.dimensions="3D"
    data.bevel_depth=thickness
    data.bevel_resolution=3
    spline=data.splines.new("POLY")
    spline.points.add(len(points)-1)
    for co,point in zip(points,spline.points):
        point.co=(*co,1)
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


root=empty("TerminalRoot",(0,0,0))
block("Housing",(0,.12,1.62),(2.50,1.34,2.23),shell,.12)
block("Front casting",(0,-.55,1.61),(2.42,.21,2.15),deck,.098)
block("Rear service plate",(0,.805,1.60),(2.29,.11,1.98),back,.076)
profile("Sloped key deck",2.50,[(-1.55,.22),(.81,.22),(.81,.54),(-.54,.77),(-1.55,.47)],deck)
profile("Lower chassis seam",2.47,[(-1.51,.15),(.79,.15),(.79,.25),(-1.51,.25)],rubber)
for x in (-.94,.94):
    for y in (-1.19,.55):
        cylinder("Rubber foot",(x,y,.10),.16,.20,rubber)

block("CRT_Glass",(0,-.68,1.68),(2.17,.14,1.77),glass,.102)
block("CRT inner lip",(0,-.751,1.68),(1.98,.065,1.58),rubber,.085)
# Front-facing display with explicit UVs and a rounded corner outline.
vertices=[]
for cx,cz,start in [(.84,.59,0),(-.84,.59,90),(-.84,-.59,180),(.84,-.59,270)]:
    for step in range(9):
        angle=math.radians(start+step*90/8)
        vertices.append((cx+math.cos(angle)*.118,-.79,1.68+cz+math.sin(angle)*.118))
mesh=bpy.data.meshes.new("Screen aperture UV")
mesh.from_pydata(vertices,[],[tuple(range(len(vertices)))])
mesh.update()
uv=mesh.uv_layers.new()
for loop in mesh.loops:
    x,_,z=vertices[loop.vertex_index]
    uv.data[loop.index].uv=(x/1.916+.5,(z-1.68)/1.416+.5)
screen=bpy.data.objects.new("CRT_Display",mesh)
bpy.context.collection.objects.link(screen)
screen.data.materials.append(phosphor)

for x in (-1.10,1.10):
    for z in (.73,2.49):
        cylinder("Front screw",(x,-.677,z),.038,.028,metal,"y",18)
        block("Screw slot",(x,-.695,z),(.043,.005,.008),rubber,.002)
        cylinder("Service screw",(x,.872,z),.037,.018,metal,"y",18)

for index,(name,x,width,mark) in enumerate([
    ("Key_Left",-.77,.54,"<"),("Key_Enter",0,.70,"ENTER"),("Key_Right",.77,.54,">")]):
    pivot=empty(name,(x,-1.04,.652))
    block(name+" socket",(x,-1.04,.628),(width+.10,.58,.105),rubber,.048).rotation_euler.x=.27
    block(name+" cap",(0,0,.067),(width,.48,.18),cap_colors[index],.062,pivot).rotation_euler.x=.27
    label(name+" legend",mark,(0,-.022,.172),.10 if index==1 else .245,legend,(.27,0,0),pivot)

block("Cartridge housing",(-.62,.04,2.84),(.78,.39,.34),amber,.07)
for i in range(12):
    block("Cartridge rib",(-.94+i*.057,-.17,2.85),(.023,.055,.263),amber,.010)
cylinder("Dial collar",(1.265,-.12,2.18),.23,.14,rubber,"x")
cylinder("Dial face",(1.365,-.12,2.18),.198,.16,metal,"x",48)
for i in range(24):
    angle=i*math.tau/24
    block("Dial knurl",(1.39,-.12+math.cos(angle)*.193,2.18+math.sin(angle)*.193),
          (.115,.017,.017),metal,.004)
for r in range(5):
    for c in range(6):
        if (r-2)**2+(c-2.5)**2<12:
            cylinder("Speaker perforation",(1.257,-.13+c*.099,1.66-r*.101),.023,.014,rubber,"x",12)
for row in range(6):
    for col in range(3):
        block("Rear vent",(-.67+col*.67,.87,2.32-row*.115),(.53,.021,.038),rubber,.014)
block("Equipment label",(-.54,.879,1.26),(.75,.029,.19),paper,.012)
label("Serial","INDEX WORKS  /  02",(-.54,.896,1.26),.064,legend,(math.pi/2,0,math.pi))
for x,width in [(.14,.24),(.48,.16),(.76,.17)]:
    block("Rear socket",(x,.880,.73),(width,.046,.13),rubber,.012)
    block("Socket surround",(x,.909,.73),(width*.62,.012,.055),metal,.003)
cylinder("Wrist strap anchor",(1.27,.43,1.56),.075,.10,metal,"x",20)
points=[]
for i in range(85):
    t=i*math.tau/84
    points.append((1.30+.19*(1-math.cos(t))+.058*math.sin(t),.43+.20*math.sin(t)-.24*(1-math.cos(t)),1.57-.55*(1-math.cos(t))))
strap=curve("Cobalt wrist loop",points,.032,blue)
bpy.context.view_layer.objects.active=strap
bpy.ops.object.select_all(action="DESELECT")
strap.select_set(True)
bpy.ops.object.convert(target="MESH")
for obj in list(bpy.context.scene.objects):
    if obj!=root and not obj.parent:
        obj.parent=root

scene=bpy.context.scene
objects_to_export=set(scene.objects)
repeat_prefixes=("Cartridge rib","Dial knurl","Speaker perforation","Rear vent","Front screw","Service screw","Screw slot","Rubber foot")
repeat_groups={}
for obj in scene.objects:
    if obj.name.startswith(repeat_prefixes) and obj.parent==root:
        repeat_groups.setdefault(obj.data.materials[0].name,[]).append(obj)
export_meshes=[]
graph=bpy.context.evaluated_depsgraph_get()
for key, group in repeat_groups.items():
    if len(group)<2:
        continue
    copies=[]
    for source in group:
        mesh=bpy.data.meshes.new_from_object(source.evaluated_get(graph))
        copy=bpy.data.objects.new(key+" details",mesh)
        bpy.context.collection.objects.link(copy)
        copy.parent=root
        copy.matrix_world=source.matrix_world
        copies.append(copy)
    bpy.ops.object.select_all(action="DESELECT")
    for copy in copies:
        copy.select_set(True)
    bpy.context.view_layer.objects.active=copies[0]
    bpy.ops.object.join()
    merged=bpy.context.object
    merged.name=key+" hardware"
    export_meshes.append(merged)
    objects_to_export.difference_update(group)
    objects_to_export.add(merged)
bpy.ops.object.select_all(action="DESELECT")
for obj in objects_to_export:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/"terminal.glb"),export_format="GLB",
                         use_selection=True,export_animations=False,export_apply=True)
for obj in export_meshes:
    bpy.data.objects.remove(obj,do_unlink=True)


def aim(obj, point):
    obj.rotation_euler=(Vector(point)-obj.location).to_track_quat("-Z","Y").to_euler()


bpy.ops.object.camera_add(location=(3.28,-7.6,3.80))
camera=bpy.context.object
aim(camera,(0,-.16,1.48))
camera.data.lens=59
scene.camera=camera
for name,loc,power,size in [
    ("Window softbox",(-4,-4,7),750,5.0),
    ("Front bounce",(2,-5,3.5),280,4.0),
    ("Upper rim",(3,2,5),550,3.0)]:
    bpy.ops.object.light_add(type="AREA",location=loc)
    light=bpy.context.object
    light.name=name
    light.data.energy=power
    light.data.shape="DISK"
    light.data.size=size
    aim(light,(0,0,1.35))
scene.world.use_nodes=True
scene.world.node_tree.nodes.get("Background").inputs[0].default_value=(.36,.40,.44,1)
scene.world.node_tree.nodes.get("Background").inputs[1].default_value=.35
scene.render.engine="CYCLES"
scene.cycles.samples=20
scene.cycles.use_denoising=True
scene.render.resolution_x=800
scene.render.resolution_y=800
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format="PNG"
scene.view_settings.view_transform="AgX"

nodes=phosphor.node_tree.nodes
shader=nodes.get("Principled BSDF")
texture=nodes.new("ShaderNodeTexImage")
shader.inputs["Emission Strength"].default_value=.72
phosphor.node_tree.links.new(texture.outputs["Color"],shader.inputs["Base Color"])
phosphor.node_tree.links.new(texture.outputs["Color"],shader.inputs["Emission Color"])
for slug, entry in [("signal-field",2),("matter-studies",3)]:
    texture.image=bpy.data.images.load(str(PUBLIC/(slug+f"-{entry}.webp")),check_existing=True)
    texture.image.pack()
    if slug=="signal-field":
        bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"art"/"terminal.blend"))
    poster_filter=next((arg.split("=",1)[1] for arg in sys.argv if arg.startswith("--poster=")),None)
    if "--export-only" not in sys.argv and poster_filter in (None,slug):
        render_dir=ROOT/"review"
        render_dir.mkdir(exist_ok=True)
        scene.render.filepath=str(render_dir/(slug+"-poster.png"))
        bpy.ops.render.render(write_still=True)
