export {};

const lesson=document.querySelector<HTMLElement>('[data-lesson]');
if(lesson)mount(lesson);

function mount(page:HTMLElement){
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
    if(event.target instanceof Element && event.target.closest('a,button,input,select,textarea,summary,video,[contenteditable]'))return;
    const destination=event.key.toLowerCase()==='n'?page.dataset.next:event.key.toLowerCase()==='p'?page.dataset.prev:undefined;
    if(destination){event.preventDefault();location.assign(destination);}
  });
  try{
    const arrival=JSON.parse(sessionStorage.getItem('index-works-arrival')||'null');
    sessionStorage.removeItem('index-works-arrival');
    const motion=localStorage.getItem('index-works-motion')!=='pause'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(motion&&arrival?.slug===page.dataset.slug&&Date.now()-arrival.time<4500)page.dataset.arrival='';
  }catch{}
  for (const exhibit of page.querySelectorAll<HTMLElement>('[data-switch]')) {
    const controls = [...exhibit.querySelectorAll<HTMLButtonElement>('[data-switch-button]')];
    const copy = exhibit.querySelectorAll<HTMLElement>('[data-copy]');
    const scenes = exhibit.querySelectorAll<HTMLElement>('[data-scene]');
    for (const item of copy) item.hidden = item.dataset.copy !== exhibit.dataset.active;
    exhibit.querySelector<HTMLElement>('.atlas-controls')?.removeAttribute('hidden');
    for (const control of controls) {
      control.addEventListener('click', () => {
        const active = control.dataset.switchButton;
        exhibit.dataset.active = active;
        for (const item of controls) item.setAttribute('aria-pressed', String(item === control));
        for (const item of copy) item.hidden = item.dataset.copy !== active;
        for (const scene of scenes) scene.hidden = scene.dataset.scene !== active;
      });
    }
  }
  const inventory=page.querySelector<HTMLFormElement>('[data-inventory]');
  if(inventory){
    const filter=inventory.querySelector('select')!;
    const link=page.querySelector<HTMLAnchorElement>('[data-inventory-link]')!;
    const allowed=new Set(['all','active','archived']);
    function display(){
      const status=new URLSearchParams(location.search).get('status')||'all';
      filter.value=allowed.has(status)?status:'all';
      for(const row of page.querySelectorAll<HTMLElement>('[data-mission]'))row.hidden=filter.value!=='all'&&row.dataset.mission!==filter.value;
      link.href=location.href;
    }
    inventory.addEventListener('submit',event=>{
      event.preventDefault();
      const url=new URL(location.href);
      if(filter.value==='all')url.searchParams.delete('status');
      else url.searchParams.set('status',filter.value);
      url.hash='tanstack-start';
      history.pushState({},'',url);
      display();
    });
    window.addEventListener('popstate',display);
    display();
  }
  const survey=page.querySelector('[data-survey]');
  if(survey){
    const buttons=[...survey.querySelectorAll<HTMLButtonElement>('[data-metric]')];
    const panels=[...survey.querySelectorAll<HTMLElement>('[data-chart]')];
    buttons.forEach(button=>button.addEventListener('click',()=>{
      buttons.forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
      panels.forEach(panel=>{panel.hidden=panel.dataset.chart!==button.dataset.metric;});
    }));
  }
}


