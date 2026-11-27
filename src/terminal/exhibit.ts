const root=document.querySelector<HTMLElement>('[data-work]');
if(root)mount(root);

function mount(root:HTMLElement){
  const slug=root.dataset.work;
  const matter=root.dataset.exhibit==='fold-book';
  const start=Number(root.dataset.start);
  const captions=JSON.parse(root.dataset.captions||'[]') as string[];
  const controls=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-state]'));
  const primary=root.querySelector<HTMLImageElement>('.primary-art')!;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const quiet=()=>{
    try{return media.matches||localStorage.getItem('index-works-motion')==='pause';}
    catch{return media.matches;}
  };
  const images=controls.map((_,index)=>{
    const image=new Image();
    image.src=`/works/${slug}-${index+1}.webp`;
    return image;
  });
  const labels=matter?['Vermilion sheet','Pleated acrylic','Vermilion acrylic folded into a fan']:['Chrome helix lit from the west','Chrome helix lit from its center','Chrome helix lit from the east'];
  let state=start;
  let revision=0;
  let animation:Animation|undefined;
  async function select(value:number,focus=false){
    const request=++revision;
    if(value===state)return;
    state=value;
    controls.forEach((button,index)=>button.setAttribute('aria-pressed',String(index+1===value)));
    if(focus)controls[value-1].focus();
    const reading=root.querySelector('[data-reading]');
    if(reading)reading.textContent=captions[value-1];
    const angle=root.querySelector('[data-angle]');
    if(angle)angle.textContent=['−45°','0°','+45°'][value-1];
    const plate=root.querySelector('[data-plate]');
    if(plate)plate.textContent=`PL. 0${value} / ACRYLIC`;
    const crease=root.querySelector<HTMLElement>('.crease-lines');
    if(crease)crease.style.rotate=`${(value-3)*-6}deg`;
    try{await images[value-1].decode();}catch{return;}
    if(request!==revision)return;
    animation?.cancel();
    if(!quiet()&&matter){
      animation=primary.animate([{transform:'rotateY(0)'},{transform:'rotateY(-83deg)',opacity:.28}],{duration:145,easing:'ease-in',fill:'forwards'});
      try{await animation.finished;}catch{return;}
      if(request!==revision)return;
      animation.cancel();
    }
    primary.src=images[value-1].src;
    primary.alt=labels[value-1];
    if(!quiet()){
      animation=primary.animate(matter?[{transform:'rotateY(-82deg)',opacity:.35},{transform:'rotateY(0)',opacity:1}]:[{opacity:.68},{opacity:1}],{duration:matter?335:310,easing:'cubic-bezier(.2,.75,.25,1)'});
    }
  }
  controls.forEach((button,index)=>button.addEventListener('click',()=>void select(index+1)));
  root.querySelector('.selector')?.addEventListener('keydown',event=>{
    const key=(event as KeyboardEvent).key;
    if(key!=='ArrowLeft'&&key!=='ArrowRight')return;
    event.preventDefault();
    void select((state-1+(key==='ArrowRight'?1:2))%3+1,true);
  });
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape')location.assign(`/?project=${slug}`);
  });
  try{
    const arrival=JSON.parse(sessionStorage.getItem('index-works-arrival')||'null');
    sessionStorage.removeItem('index-works-arrival');
    if(arrival?.slug===slug && Date.now()-arrival.time<4500 && !quiet())root.dataset.arrival='';
  }catch{}
}
