import {asset, home, chapters as projects, route} from '../chapters';
import type {TerminalScene} from './scene';

type Command = 'left' | 'open' | 'right';
const root = document.querySelector<HTMLElement>('[data-archive]');

if (root) mount(root);

function mount(root: HTMLElement) {
  const viewport=root.querySelector<HTMLElement>('.viewport')!;
  const overlay=root.querySelector<HTMLElement>('.keys')!;
  const stage=root.querySelector<HTMLElement>('.stage')!;
  const poster=root.querySelector<HTMLImageElement>('.poster')!;
  const orbit=root.querySelector<HTMLButtonElement>('[data-orbit]')!;
  const motion=root.querySelector<HTMLButtonElement>('[data-motion]')!;
  const entry=root.querySelector<HTMLImageElement>('.entry img')!;
  const mediaMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=false;
  try{paused=localStorage.getItem('index-works-motion')==='pause';}catch{}
  const reduced=()=>paused||mediaMotion.matches;
  let scene:TerminalScene|undefined;
  let requested=fromUrl(), shown=requested;
  let opening=false;
  let timer:number|undefined;
  let sceneRequest=0;
  const posterUrl=(index:number)=>asset(projects[index],'poster');
  function fromUrl(){
    const slug=new URLSearchParams(location.search).get('chapter');
    return Math.max(0,projects.findIndex(project=>project.slug===slug));
  }
  function show(index:number, writeUrl=false){
    const project=projects[index];
    shown=index;
    root.dataset.atmosphere=project.atmosphere;
    root.querySelector('[data-title]')!.textContent=project.title;
    root.querySelector('[data-discipline]')!.textContent=project.discipline;
    root.querySelector('[data-count]')!.textContent=`${String(index+1).padStart(2,'0')} / ${String(projects.length).padStart(2,'0')}`;
    for(const anchor of root.querySelectorAll<HTMLAnchorElement>('a[data-command="open"],a[data-key="open"]')) anchor.href=route(project);
    const nextPoster=posterUrl(index);
    if(poster.getAttribute('src')!==nextPoster)poster.src=nextPoster;
    scene?.select(project);
    if(writeUrl)history.replaceState(history.state,'',home(project));
  }
  function setOrbit(moving:boolean){
    root.toggleAttribute('data-orbiting', moving);
    orbit.innerHTML=moving?'↺ <span>Reset view</span>':'↻ <span>Orbit PC</span>';
  }
  function stopScene(){
    sceneRequest++;
    scene?.dispose();
    scene=undefined;
    root.dataset.mode='poster';
    orbit.disabled=true;
    setOrbit(false);
  }
  async function startScene(){
    const token=++sceneRequest;
    if(reduced()) return;
    root.dataset.mode='loading';
    try{
      const {createScene}=await import('./scene');
      if(token!==sceneRequest||reduced())return;
      const ready=await createScene(viewport,overlay,projects[shown],setOrbit,stopScene);
      if(token!==sceneRequest||reduced()){ready.dispose();return;}
      scene=ready;
      scene.select(projects[shown]);
      root.dataset.mode='three';
      orbit.disabled=false;
    }catch{
      if(token===sceneRequest)stopScene();
    }
  }
  function applyMotion(){
    root.toggleAttribute('data-reduced',reduced());
    motion.setAttribute('aria-pressed',String(reduced()));
    motion.textContent=reduced()?'Resume motion':'Pause motion';
    motion.disabled=mediaMotion.matches;
    if(reduced())stopScene();
    else if(!scene)void startScene();
  }
  function command(action:Command){
    if(opening)return;
    if(timer!==undefined){clearTimeout(timer);timer=undefined;}
    scene?.reset();
    if(action==='open'){
      opening=true;
      if(shown!==requested)show(requested,true);
      const project=projects[requested];
      if(reduced()){location.assign(route(project));return;}
      scene?.press('open');
      entry.src=asset(project,'crt');
      window.setTimeout(()=>{
        root.dataset.opening='';
        try{sessionStorage.setItem('index-works-arrival',JSON.stringify({slug:project.slug,time:Date.now()}));}catch{}
        window.setTimeout(()=>location.assign(route(project)),220);
      },85);
      return;
    }
    requested=(requested+(action==='right'?1:-1)+projects.length)%projects.length;
    if(reduced()){show(requested,true);return;}
    scene?.press(action);
    timer=window.setTimeout(()=>{timer=undefined;show(requested,true);},85);
  }
  for(const control of root.querySelectorAll<HTMLElement>('[data-command],[data-key]')){
    control.addEventListener('click',event=>{
      if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      command((control.dataset.command||control.dataset.key) as Command);
    });
  }
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){scene?.reset();return;}
    if(event.key==='Enter' && event.target instanceof HTMLElement && event.target.closest('a,button'))return;
    const action=({ArrowLeft:'left',ArrowRight:'right',Enter:'open'} as const)[event.key as 'ArrowLeft'];
    if(!action||event.ctrlKey||event.altKey||event.metaKey||event.defaultPrevented)return;
    event.preventDefault();
    if(!event.repeat)command(action);
  });
  orbit.addEventListener('click',()=>scene?.orbit());
  motion.addEventListener('click',()=>{
    paused=!paused;
    try{localStorage.setItem('index-works-motion',paused?'pause':'play');}catch{}
    applyMotion();
  });
  mediaMotion.addEventListener('change',applyMotion);
  window.addEventListener('pageshow',event=>{
    if(!event.persisted) return;
    opening=false;
    delete root.dataset.opening;
    requested=fromUrl();
    show(requested);
    applyMotion();
  });
  window.addEventListener('pagehide',event=>{if(!event.persisted)stopScene();});
  window.addEventListener('popstate',()=>{requested=fromUrl();show(requested);});
  show(requested);
  overlay.hidden=false;
  root.querySelector<HTMLElement>('.actions')!.hidden=false;
  root.querySelector<HTMLElement>('.project-links')!.hidden=true;
  if(new URLSearchParams(location.search).has('chapter')) stage.focus({preventScroll:true});
  requestAnimationFrame(()=>requestAnimationFrame(applyMotion));
}
