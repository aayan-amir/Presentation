// Local Figma authoring tools. The artwork stays inside the existing design file.
function wrap(node) {
 return {node,append(child){node.appendChild(child.node);return child;},moveTo(parent){parent.append(this);return this;}};
}
function element(make, props) {
 const node=make();const {width,height,x,y,...rest}=props;
 if(width!==undefined)node.resize(width,height);
 if(rest.fontName)node.fontName=rest.fontName;
 Object.assign(node,rest);
 if(x!==undefined)node.x=x;if(y!==undefined)node.y=y;
 return wrap(node);
}
const $fig={
 frame:p=>element(()=>figma.createFrame(),p),
 rectangle:p=>element(()=>figma.createRectangle(),p),
 text:p=>element(()=>figma.createText(),p),
 group:(p,children)=>{const group=figma.group(children.map(c=>c.node),children[0].node.parent);group.name=p.name;return wrap(group);},
 done:()=>Promise.resolve()
};
const paths=["M 94 376 L 99 358 L 123 334 Q 126 332 131 332 L 173 335 L 181 347 L 163 384 Q 160 388 154 387 L 96 382 Z","M 172 386 L 178 366 L 199 339 Q 201 336 206 337 L 252 340 L 261 352 L 244 391 Q 242 395 237 394 L 174 390 Z","M 252 392 L 259 372 L 279 345 Q 281 342 286 342 L 332 345 L 341 357 L 323 398 Q 320 402 315 401 L 254 396 Z"];
function shape(p,name,d,fill,mask=false){
  const hex=Object.values(fill[0].color).map(c=>Math.round(c*255).toString(16).padStart(2,"0")).join("");
  const node=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><path fill="#'+hex+'" d="'+d+'"/></svg>');
  p.node.appendChild(node);node.name=name;node.x=0;node.y=0;node.isMask=mask;if(mask)node.maskType="ALPHA";return wrap(node);
}
function shell(parent,project,pressed,x,y,size,machine,artwork){const outer=$fig.frame({name:"Archive terminal",x,y,width:512,height:512,clipsContent:false,fills:[]});parent.append(outer);box(outer,"Cast housing and studio shadow",0,0,512,512,machine);
{const mask=shape(outer,"Curved glass aperture","M 161 114 C 183 103 291 99 330 106 Q 343 108 347 130 C 352 164 353 236 347 272 Q 346 283 339 286 C 300 292 196 288 158 281 Q 151 279 150 269 C 145 229 147 152 153 128 Q 155 117 161 114 Z",color("ffffff"),true);const art=box(outer,"Emissive project screen",145,98,210,195,artwork[project]);$fig.group({name:"Display glass"},[mask,art]).moveTo(outer);}
if(pressed>=0){shape(outer,"Switch well",paths[pressed],color("171818"));const mask=shape(outer,"Keycap outline",paths[pressed],color("ffffff"),true);const tex=box(outer,"Keycap surface",0,0,512,512,machine);const cut=$fig.group({name:"Depressed keycap"},[mask,tex]);outer.append(cut);}
const hs=[[90,328,89,62],[177,332,80,66],[258,337,85,66]].map((v,i)=>box(outer,["Previous project","Open project","Next project"][i],...v,[{type:"SOLID",color:{r:0,g:0,b:0},opacity:.001}]));return {outer,hs,size,x,y};}

const font = {
 mono:{family:"IBM Plex Mono",style:"Regular"}, sans:{family:"Space Grotesk",style:"Medium"},
 serif:{family:"Cormorant Garamond",style:"Medium"}, italic:{family:"Cormorant Garamond",style:"Italic"}
};
const names=["Signal Field","Matter Studies"], entry=[1,2];
const stops=[["West","Zenith","East"],["Sheet","Pleat","Fan"]];
const captions=[
 ["A lateral reflection picks out the left flank of each turn.","At centre, the strip breaks into a vertical chain of highlights.","The brightest edge crosses to the right as the lamp moves."],
 ["Flat stock carries a fine rib that catches the light at its edge.","Alternating folds pull the ribs closer and deepen their shadows.","The pleats pivot around one point and open into a fan."]
];
const paper="f4eddf", wine="742817", cyan="90e5e6", night="081014";
const invisible=[{type:"SOLID",color:{r:0,g:0,b:0},opacity:.001}];
function color(h){return [{type:"SOLID",color:{r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255}}];}
function box(p,name,x,y,width,height,fill,radius=0){
 const a=$fig.rectangle({name,x,y,width,height,cornerRadius:radius,fills:typeof fill==="string"?color(fill):fill});p.append(a);return a;
}
function label(p,name,x,y,value,size,face,fg,width){
 const a=$fig.text({name,x,y,fontName:font[face],fontSize:size,characters:value,fills:color(fg)});
 p.append(a);
 if(width){a.node.textAutoResize="HEIGHT";a.node.resize(width,a.node.height);}
 return a;
}
function section(page,name,x,y,w,h){
 const s=figma.createSection();page.appendChild(s);s.name=name;s.resizeWithoutConstraints(w,h);s.x=x;s.y=y;return s;
}
function component(parent,name,w,h,x,y){
 const n=figma.createComponent();parent.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;n.fills=[];return wrap(n);
}
function instance(master,parent,x,y,w){
 const n=master.node.createInstance();parent.node.appendChild(n);if(w)n.rescale(w/n.width);n.x=x;n.y=y;return n;
}
const key=code=>({type:"ON_KEY_DOWN",device:"KEYBOARD",keyCodes:[code]});
const click={type:"ON_CLICK"};
function reaction(trigger,dest,transition=null){
 return {trigger,actions:[{type:"NODE",navigation:"NAVIGATE",destinationId:dest.id,transition,resetScrollPosition:true}]};
}
const dissolve=t=>({type:"DISSOLVE",duration:t,easing:{type:"EASE_OUT"}});
const turn={type:"PUSH",direction:"LEFT",matchLayers:false,duration:.20,easing:{type:"EASE_OUT"}};
const ids=["1:17","1:84","1:148","1:208","1:265","1:297","1:329","1:346","2:70","2:86","2:80","2:96","1:360"];
function reference(p,x,title,note,fill){
 box(p,title,x,75,340,230,fill);
 label(p,title+" title",x,325,title,22,"sans","202322");
 label(p,title+" decision",x,369,note,15,"mono","37403d",338);
}
function detail(frame,m,p,s,images){
 const w=frame.node.width, margin=m?18:58, dark=p===0, fg=dark?"d6e8e8":wine;
 const tabs=[], ink=dark?cyan:wine;
 frame.node.overflowDirection="VERTICAL";
 label(frame,"Studio signature",margin,20,"Index Works",m?17:21,"sans",fg);
 label(frame,"Return",w-(m?165:218),24,"← Back to terminal",m?13:16,"mono",fg);
 const back=box(frame,"Return to selected terminal",w-(m?176:230),10,m?170:220,48,invisible).node;
 if(dark){
  label(frame,"Instrument title",margin,m?82:74,"Signal Field",m?31:46,"mono",fg);
  box(frame,"Optical chamber",m?0:236,m?146:135,m?w:968,m?374:472,images[p][s]);
  if(!m){
   for(let j=0;j<9;j++){box(frame,"Scale mark",87,208+j*40,j%4?10:20,1,"5c8187");}
   label(frame,"Lamp position",1191,245,["−45°","0°","+45°"][s],34,"mono",cyan);
   label(frame,"Lamp label",1195,294,"LIGHT ANGLE",12,"mono",fg);
  }
 }else{
  box(frame,"Header hairline",margin,m?64:72,w-margin*2,1,"baac9d");
  label(frame,"Project title",margin,m?78:144,m?"Matter Studies":"Matter\nStudies",m?55:116,"serif",wine);
  if(!m)label(frame,"Material",margin,479,"Pleated acrylic",32,"italic",wine);
  box(frame,"Acrylic specimen",m?0:568,m?178:100,m?w:872,m?323:510,images[p][s]);
 }
 const y=m?535:632, x=m?margin:(dark?238:580), tabW=m?115:178;
 label(frame,"Interaction",x,y,dark?"Sweep the light":"Unfold the specimen",m?17:24,dark?"mono":"italic",ink);
 for(let j=0;j<3;j++){
  const xx=x+j*tabW;
  box(frame,"Track",xx,y+85,tabW-6,j===s?3:1,j===s?ink:(dark?"456069":"b3a28c"));
  label(frame,"Stop "+j,xx+8,y+48,stops[p][j],m?15:19,dark?"mono":"serif",fg);
  tabs.push(box(frame,"Select "+stops[p][j],xx,y+40,tabW-5,49,invisible).node);
 }
 label(frame,"Observation",x,y+105,captions[p][s],m?15:19,dark?"sans":"serif",fg,m?w-2*margin:640);
 if(!dark){
  const length=m?73:126;
  for(let k=0;k<8;k++){const line=box(frame,"Fold diagram",margin+10+k*(length/7),m?742:565,2,18+k*s*2,wine);line.node.rotation=(k-3.5)*s*6;}
 }
 const below=m?892:916;
 box(frame,"Section rule",margin,below,w-margin*2,1,dark?"486168":"ae9b86");
 label(frame,"Study notes",margin,below+28,dark?"Reading the reflection":"From sheet to fan",m?30:46,dark?"sans":"serif",fg);
 if(dark){
  const crop=$fig.frame({name:"Magnified coil",x:margin,y:below+105,width:m?354:725,height:m?232:345,clipsContent:true,fills:[]});frame.append(crop);
  box(crop,"Surface close-up",m?-270:-390,m?-246:-370,m?880:1490,m?672:1138,images[0][s]);
  label(frame,"Close-up note",m?margin:850,m?below+370:below+145,"A polished tube bends one strip of light into many. Follow the bright edge around a turn to read its curvature.",m?19:30,"sans",fg,m?354:490);
 }else{
  const gap=m?6:18,cw=(w-2*margin-2*gap)/3;
  for(let j=0;j<3;j++){box(frame,"Folding sequence "+j,margin+j*(cw+gap),below+110,cw,m?106:236,images[1][j]);label(frame,"Plate caption",margin+j*(cw+gap),below+(m?224:361),stops[1][j],m?15:22,"italic",fg);}
  const crop=$fig.frame({name:"Acrylic ribs · macro",x:margin,y:below+(m?290:421),width:m?354:620,height:m?160:225,clipsContent:true,fills:[]});frame.append(crop);
  box(crop,"Enlarged pleat edge",-220,-210,940,718,images[1][2]);
  label(frame,"Macro note",m?margin:770,m?below+475:below+468,"At the fold, the same orange sheet gathers into a darker line.",m?20:31,"serif",wine,m?350:470);
 }
 return {back,tabs};
}

async function run(){
 const original=await figma.getNodeByIdAsync("7:58");
 if(!original||!Array.isArray(original.fills)||!original.fills.some(p=>p.type==="IMAGE"))throw Error("Open the original Index Works design file to use the terminal master.");
 let page=original.parent;while(page.type!=="PAGE")page=page.parent;
 await figma.setCurrentPageAsync(page);
 const findRole=role=>page.children.find(n=>n.getPluginData("archiveRole")===role);
 if(figma.command==="retire" || figma.command==="restore"){
  if(!findRole("review"))throw Error("Create the interactive edition first.");
  const retire=figma.command==="retire";
  for(const id of ids){const n=await figma.getNodeByIdAsync(id);if(!n)continue;if(retire && n.visible){n.setPluginData("retiredByArchive","1");n.visible=false;}else if(!retire && n.getPluginData("retiredByArchive")){n.visible=true;n.setPluginData("retiredByArchive","");}}
  for(const p of figma.root.children){if(p.getPluginData("archiveEdition")!=="complete")continue;await p.loadAsync();
   for(const n of p.children){if(retire && n.visible){n.visible=false;n.setPluginData("retiredByArchive","1");}else if(!retire && n.getPluginData("retiredByArchive")){n.visible=true;n.setPluginData("retiredByArchive","");}}}
  if(retire && !page.getPluginData("legacyStarts")){page.setPluginData("legacyStarts",JSON.stringify(page.flowStartingPoints.filter(f=>ids.includes(f.nodeId))));page.flowStartingPoints=page.flowStartingPoints.filter(f=>!ids.includes(f.nodeId));}
  if(!retire && page.getPluginData("legacyStarts")){page.flowStartingPoints=page.flowStartingPoints.concat(JSON.parse(page.getPluginData("legacyStarts")));page.setPluginData("legacyStarts","");}
  return retire?"Superseded prototype screens retired. Restore is available in the plugin menu.":"Legacy screens restored.";
 }
 if(findRole("review")){figma.viewport.scrollAndZoomIntoView([findRole("review")]);return "Opened the existing interactive edition.";}
 await Promise.all(Object.values(font).map(f=>figma.loadFontAsync(f)));
 const assets=JSON.parse(__html__);
 function image(key){const hash=figma.createImage(figma.base64Decode(assets[key])).hash;return [{type:"IMAGE",scaleMode:"FILL",imageHash:hash}];}
 const images=["signal","matter"].map(k=>[0,1,2].map(i=>image(k+i)));
 const origin=Math.max(0,...page.children.map(n=>n.y+n.height))+320;
 const created=[];
 const oldStarts=page.flowStartingPoints;
 try{
  const create=(role,name,x,y,w,h)=>{const n=section(page,name,x,y,w,h);created.push(n);n.setPluginData("archiveRole",role);return n;};
  const review=create("review","Start here",0,origin,4650,2100);
  const library=create("library","Components & artwork",0,origin+2400,6500,2700);
  const ref=create("refs","References",0,origin+5450,1560,565);
  const states=create("states","Prototype states",6800,origin,19300,10200);
  const r=wrap(ref);
  if(assets.reference)reference(r,34,"Odama · stage","One grounded silhouette. Three keys project toward the visitor.",image("reference"));
  reference(r,410,"Terminal · shell","Hold the camera, bezel and glass steady through a change of project.",original.fills);
  for(let p=0;p<2;p++){
   const source=await figma.getNodeByIdAsync(["12:58","12:59"][p]);
   reference(r,785+p*380,names[p],p?"Warm acrylic, a visible fold axis and a tight material crop.":"Chrome against a dark field. Let the reflection describe the curve.",source && source.fills || images[p][entry[p]]);
  }
  const libraryFrame=$fig.frame({name:"Artwork masters",width:2220,height:1280,x:80,y:1280,fills:[]});library.appendChild(libraryFrame.node);libraryFrame.node.x=80;libraryFrame.node.y=1280;
  for(let p=0;p<2;p++)for(let i=0;i<3;i++){box(libraryFrame,names[p]+" · "+stops[p][i],i*730,p*600,704,538,images[p][i]);}
  const machines=[];
  for(let p=0;p<2;p++){machines[p]=[];
   for(let pose=-1;pose<3;pose++){
    const master=component(library,names[p]+" / "+(["Rest","Left","Enter","Right"][pose+1]),512,512,(pose+1)*565+80,p*600+60);
    const parts=shell(master,p,pose,0,0,512,original.fills,[images[0][1],images[1][2]]);
    const cut=parts.outer.node.children.find(n=>n.name==="Depressed keycap");
    if(cut){cut.y+=5;cut.x-=1;}
    machines[p][pose+1]=master;
   }
  }
  const rows=[],index=new Map();
  function lookup(m,quiet,p,view,state){return index.get([m,quiet,p,view,state].join("/"));}
  let extra=0;
  function make(m,quiet,p,view,s){
   const w=m?390:1440,h=m?844:860;
   const featured=!quiet && ((view==="home" && p===0 && s===-1)||(view==="project" && s===entry[p]));
   const parent=featured?review:states;
   const pos=featured?(view==="home"?0:p+1):extra++;
   const x=featured?44+pos*1520:44+(pos%12)*1570;
   const y=featured?(m?1110:68):70+Math.floor(pos/12)*1700;
   const f=$fig.frame({name:(m?"Phone":"Desktop")+" / "+(view==="home"?"Terminal / ":"")+names[p]+" / "+(view==="home"?["Rest","Left","Enter","Right"][s+1]:stops[p][s])+(quiet?" / Reduced motion":""),width:w,height:h,fills:color(view==="home"?"e8e8e6":p?paper:night),clipsContent:true});
   parent.appendChild(f.node);f.node.x=x;f.node.y=y;
   const row={m,quiet,p,view,s,f};index.set([m,quiet,p,view,s].join("/"),row);rows.push(row);
   if(view==="project"){Object.assign(row,detail(f,m,p,s,images));return;}
   const size=m?374:590, xx=(w-size)/2,yy=m?133:72,margin=m?18:38;
   instance(machines[p][s+1],f,xx,yy,size);
   label(f,"Studio",margin,20,"Index Works",m?19:26,"sans","191918");
   label(f,"Collection",w-(m?139:200),26,"Selected works",m?13:17,"mono","191918");
   label(f,"Project",margin,m?558:675,names[p],m?51:84,"sans","191918");
   label(f,"Discipline",margin,m?632:791,p?"Material experiments":"Optical studies",m?14:17,"mono","333634");
   label(f,"Selection",w-(m?77:110),m?588:716,"0"+(p+1)+" / 02",m?13:17,"mono","191918");
   label(f,"Interaction",margin,m?725:827,m?"Tap a key to browse or open":"← →   Browse      ↵   Open",13,"mono","363a38");
   label(f,"Motion setting",w-(m?182:228),m?783:819,quiet?"Motion: reduced":"Motion: full",14,"mono","383c39");
   row.toggle=box(f,"Change motion setting",w-(m?194:245),m?763:802,m?186:225,46,invisible).node;
   row.keys=[[94,329,84,63],[180,334,76,65],[259,340,84,64]].map((v,j)=>box(f,["Previous project","Open project","Next project"][j],xx+v[0]*size/512,yy+v[1]*size/512,Math.max(44,v[2]*size/512),Math.max(44,v[3]*size/512),invisible).node);
  }
  for(const m of [false,true])for(const quiet of [false,true])for(let p=0;p<2;p++){
   for(const s of quiet?[-1]:[-1,0,1,2])make(m,quiet,p,"home",s);
   for(let s=0;s<3;s++)make(m,quiet,p,"project",s);
  }
  for(const r of rows){
   const {m,quiet,p,s,view,f}=r;
   const to=(project,view,state)=>lookup(m,quiet,project,view,state).f.node;
   if(view==="home" && s===-1){
    const dest=n=>quiet?(n===1?to(p,"project",entry[p]):to(1-p,"home",-1)):to(p,"home",n);
    await f.node.setReactionsAsync([37,13,39].map((c,i)=>reaction(key(c),dest(i))));
    for(let i=0;i<3;i++)await r.keys[i].setReactionsAsync([reaction(click,dest(i))]);
    await r.toggle.setReactionsAsync([reaction(click,lookup(m,!quiet,p,"home",-1).f.node)]);
   }else if(view==="home"){
    await f.node.setReactionsAsync([reaction({type:"AFTER_TIMEOUT",timeout:.12},s===1?to(p,"project",entry[p]):to(1-p,"home",-1),dissolve(s===1?.30:.14))]);
   }else{
    const transition=quiet?null:p?turn:dissolve(.22);
    const tab=(trigger,i)=>reaction(trigger,to(p,"project",i),transition);
    await f.node.setReactionsAsync([reaction(key(27),to(p,"home",-1)),tab(key(37),(s+2)%3),tab(key(39),(s+1)%3)]);
    await r.back.setReactionsAsync([reaction(click,to(p,"home",-1))]);
    for(let j=0;j<3;j++)if(j!==s)await r.tabs[j].setReactionsAsync([tab(click,j)]);
   }
  }
  page.flowStartingPoints=oldStarts.concat([false,true].map(m=>({nodeId:lookup(m,false,0,"home",-1).f.node.id,name:m?"Phone archive":"Desktop archive"})));
  figma.viewport.scrollAndZoomIntoView([review]);
  return "Desktop and phone archives created. Start in Present to review both flows.";
 }catch(e){page.flowStartingPoints=oldStarts;for(const n of created.reverse())if(!n.removed)n.remove();throw e;}
}
run().then(message=>figma.closePlugin(message)).catch(e=>figma.closePlugin(String(e)));


