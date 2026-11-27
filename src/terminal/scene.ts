import {
  ACESFilmicToneMapping, AmbientLight, Box3, Color, DirectionalLight, Group, MathUtils,
  Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PMREMGenerator,
  Raycaster, Scene, SRGBColorSpace, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer,
} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {asset, chapters as projects, type Chapter as Project} from '../chapters';

type Key = 'left' | 'open' | 'right';
export interface TerminalScene {
  select(project: Project): void;
  press(key: Key): void;
  orbit(): void;
  reset(): void;
  dispose(): void;
}

const FRONT = Math.atan2(3.28, 7.6);
const HEIGHT = 3.80;
const DISTANCE = Math.hypot(3.28, 7.6);
const viewTarget = new Vector3(0, 1.48, .16);
const keys = {left:'Key_Left',open:'Key_Enter',right:'Key_Right'} as const;
const smooth = (t:number) => t*t*(3-2*t);

export async function createScene(
  host: HTMLElement,
  overlay: HTMLElement,
  initial: Project,
  onOrbit: (moving:boolean)=>void,
  onLost: ()=>void,
): Promise<TerminalScene> {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'default'});
  if (!gl) throw new Error('WebGL 2 unavailable');
  const renderer = new WebGLRenderer({canvas,context:gl,alpha:true,antialias:true});
  const events = new AbortController();
  const signal = events.signal;
  let disposed = false;
  let frame = 0;
  let resize: ResizeObserver | undefined;
  let visible: IntersectionObserver | undefined;
  let model: Group | undefined;
  const textures = new Map<string,Texture>();
  const previousMaterials = new Set<import('three').Material>();
  const scene = new Scene();
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    events.abort();
    cancelAnimationFrame(frame);
    resize?.disconnect();
    visible?.disconnect();
    model?.traverse(node => {
      if (node instanceof Mesh) {
        node.geometry.dispose();
        for(const material of Array.isArray(node.material)?node.material:[node.material]) previousMaterials.add(material);
      }
    });
    previousMaterials.forEach(material=>material.dispose());
    textures.forEach(texture=>texture.dispose());
    environment?.dispose();
    renderer.dispose();
    canvas.remove();
  };
  let environment: ReturnType<PMREMGenerator['fromScene']> | undefined;
  try {
    renderer.setClearColor(0,0);
    renderer.toneMapping=ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.05;
    scene.add(new AmbientLight(0xfff6e8,.42));
    const light=new DirectionalLight(0xfff4db,1.38);
    light.position.set(-4,5,4);
    scene.add(light);
    const fill=new DirectionalLight(0xd9f5ff,.83);
    fill.position.set(4,4,-3);
    scene.add(fill);

    const gltf=await new GLTFLoader().loadAsync('/works/terminal.glb');
    model=gltf.scene;
    scene.add(model);
    const screen=model.getObjectByName('CRT_Display');
    if(!(screen instanceof Mesh)) throw new Error('Model is missing the CRT display');
    const base = Array.isArray(screen.material) ? screen.material : [screen.material];
    base.forEach(material=>previousMaterials.add(material));
    const monitor=new MeshBasicMaterial({toneMapped:false});
    screen.material=monitor;
    const pivots=new Map<Key,{node:Object3D, rest:number, button:HTMLElement|null, time:number}>();
    for(const [key,name] of Object.entries(keys) as [Key,string][]){
      const node=model.getObjectByName(name);
      if(!node) throw new Error(`Model is missing ${name}`);
      pivots.set(key,{node,rest:node.position.y,button:overlay.querySelector(`[data-key="${key}"]`),time:-1000});
    }
    const textureLoader=new TextureLoader();
    let wanted=initial.slug;
    const applyScreen=(project:Project)=>{
      const texture=textures.get(project.slug);
      if(texture){
        monitor.map=texture;
        monitor.needsUpdate=true;
      }
    };
    const loadTexture=async(project:Project)=>{
      const texture=await textureLoader.loadAsync(asset(project,'crt'));
      if(disposed){texture.dispose();return;}
      texture.flipY=false;
      texture.colorSpace=SRGBColorSpace;
      texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      textures.set(project.slug,texture);
      if(wanted===project.slug) {
        applyScreen(project);
        if (textures.size>1) resume();
      }
    };
    await loadTexture(initial);
    const studio = new RoomEnvironment();
    const pmrem = new PMREMGenerator(renderer);
    environment = pmrem.fromScene(studio,.045);
    scene.environment=environment.texture;
    scene.environmentIntensity=.69;
    pmrem.dispose();
    studio.dispose();
    const bounds=new Box3().setFromObject(model);
    if (bounds.isEmpty() || bounds.max.y < 2.5 || bounds.max.y > 3.5) throw new Error('Unexpected terminal dimensions');
    const camera=new PerspectiveCamera(33.93,1,.1,50);
    let yaw=FRONT, lift=0, targetYaw=FRONT, targetLift=0;
    let orbitAt=-1, last=0, inView=true, activePointer:number|undefined;
    let lightMix=initial.atmosphere==='warm'?1:0;
    let lightFrom=lightMix, lightTarget=lightMix, lightAt=-Infinity;
    const coolRim=new Color(0xd9f5ff), warmRim=new Color(0xffc999);
    let moving=false;
    const projected=new Vector3();
    const machine=host.parentElement!;
    const feet=[new Vector3(-.94,.015,1.19),new Vector3(.94,.015,1.19),new Vector3(-.94,.015,-.55),new Vector3(.94,.015,-.55)];
    const raycast=new Raycaster();
    const pointer=new Vector2();
    const announce=(value:boolean)=>{if(moving!==value){moving=value;onOrbit(value);}};

    function placeCamera() {
      camera.position.set(Math.sin(yaw)*DISTANCE,HEIGHT+lift,Math.cos(yaw)*DISTANCE);
      camera.lookAt(viewTarget);
      camera.updateMatrixWorld();
    }
    function layout() {
      const w=host.clientWidth,h=host.clientHeight;
      if(!w||!h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,w<530?1.25:1.5));
      renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.updateProjectionMatrix();
    }
    function update(now:number) {
      const delta=Math.min((now-last)/1000,.05);
      last=now;
      lightMix=MathUtils.lerp(lightFrom,lightTarget,smooth(MathUtils.clamp((now-lightAt)/650,0,1)));
      fill.color.copy(coolRim).lerp(warmRim,lightMix);
      if(orbitAt>=0) {
        const t=Math.min((now-orbitAt)/4150,1);
        yaw=FRONT+Math.PI*2*smooth(t);
        lift=.57*Math.sin(Math.PI*t);
        if(t===1){yaw=FRONT;targetYaw=FRONT;targetLift=0;orbitAt=-1;announce(false);}
      } else {
        yaw=MathUtils.damp(yaw,targetYaw,13,delta);
        lift=MathUtils.damp(lift,targetLift,13,delta);
        if(activePointer===undefined && Math.abs(yaw-FRONT)<.055 && Math.abs(lift)<.07) announce(false);
      }
      placeCamera();
      feet.forEach((point,index)=>{
        projected.copy(point).project(camera);
        machine.style.setProperty(`--foot${index}`,`${(projected.x*.5+.5)*100}% ${(-projected.y*.5+.5)*100}%`);
      });
      for(const part of pivots.values()){
        const travel=(now-part.time)/85;
        const down=travel<=0||travel>=2 ? 0 : travel<1 ? smooth(travel) : 1-smooth(travel-1);
        part.node.position.y=part.rest-down*.086;
        part.node.getWorldPosition(projected);
        projected.y+=.15;
        projected.project(camera);
        part.button?.style.setProperty('--x',`${(projected.x*.5+.5)*100}%`);
        part.button?.style.setProperty('--y',`${(-projected.y*.5+.5)*100}%`);
      }
      renderer.render(scene,camera);
    }
    function loop(now:number) {
      if(disposed || document.hidden || !inView) {frame=0;return;}
      update(now);
      const keyInMotion=[...pivots.values()].some(part=>now-part.time<170);
      frame=orbitAt>=0 || keyInMotion || now-lightAt<650 || Math.abs(yaw-targetYaw)>.001 ||
        Math.abs(lift-targetLift)>.001 ? requestAnimationFrame(loop) : 0;
    }
    function resume(){
      if(!frame && inView && !document.hidden && !disposed){last=performance.now();frame=requestAnimationFrame(loop);}
    }
    function reset(){
      orbitAt=-1;
      targetYaw=FRONT+Math.round((yaw-FRONT)/(2*Math.PI))*2*Math.PI;
      yaw-=targetYaw-FRONT;
      targetYaw=FRONT;
      targetLift=0;
      if(activePointer!==undefined && canvas.hasPointerCapture(activePointer)) canvas.releasePointerCapture(activePointer);
      activePointer=undefined;
      resume();
    }
    canvas.addEventListener('webglcontextlost', (event)=>{event.preventDefault();onLost();},{signal});
    let lastX=0,lastY=0;
    canvas.addEventListener('pointerdown', event=>{
      if(event.button!==0 || activePointer!==undefined || !model) return;
      const rect=canvas.getBoundingClientRect();
      pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      raycast.setFromCamera(pointer,camera);
      if(!raycast.intersectObject(model,true).length) return;
      reset();
      activePointer=event.pointerId;
      canvas.setPointerCapture(activePointer);
      lastX=event.clientX;
      lastY=event.clientY;
      announce(true);
    },{signal});
    canvas.addEventListener('pointermove',event=>{
      if(activePointer!==event.pointerId) return;
      targetYaw+=(lastX-event.clientX)*.012;
      targetLift=MathUtils.clamp(targetLift+(event.clientY-lastY)*.012,-1.2,1.65);
      lastX=event.clientX;
      lastY=event.clientY;
      resume();
    },{signal});
    for(const event of ['pointerup','pointercancel','lostpointercapture']){
      canvas.addEventListener(event,()=>{activePointer=undefined;},{signal});
    }
    layout();
    await renderer.compileAsync(scene,camera);
    host.append(canvas);
    update(performance.now());
    resize=new ResizeObserver(()=>{layout();if(!frame && inView) update(performance.now());});
    resize.observe(host);
    visible=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;resume();});
    visible.observe(host);
    document.addEventListener('visibilitychange',()=>{if(document.hidden) reset();else resume();},{signal});
    for (const project of projects) if(project.slug!==initial.slug) void loadTexture(project).catch(()=>{});
    resume();
    return {
      select(project){
        wanted=project.slug;
        applyScreen(project);
        const next=project.atmosphere==='warm'?1:0;
        if(next!==lightTarget){lightFrom=lightMix;lightTarget=next;lightAt=performance.now();}
        resume();
      },
      press(key){const part=pivots.get(key);if(part)part.time=performance.now();resume();},
      orbit(){if(moving){reset();return;}reset();yaw=FRONT;lift=0;orbitAt=performance.now();announce(true);resume();},
      reset,dispose,
    };
  } catch(error) {
    dispose();
    throw error;
  }
}
