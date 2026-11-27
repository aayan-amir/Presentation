const PAGE_ID = "22:58";
const STATE_SECTION_ID = "25:1395";
const HOME = /^(Desktop|Phone) · Terminal · ([01]) · (idle|shimmer|left|open|right)( · Direct)?$/;
const STUDIO = "Studio atmosphere";

const rgb = hex => ({
  r: parseInt(hex.slice(0, 2), 16) / 255,
  g: parseInt(hex.slice(2, 4), 16) / 255,
  b: parseInt(hex.slice(4, 6), 16) / 255
});
const solid = hex => [{type: "SOLID", color: rgb(hex)}];
const ease = duration => ({type: "SMART_ANIMATE", easing: {type:"EASE_IN_AND_OUT"}, duration});

function timed(target, timeout, transition) {
  return {
    trigger: {type:"AFTER_TIMEOUT", timeout},
    actions: [{
      type:"NODE", destinationId:target.id, navigation:"NAVIGATE", transition,
      resetScrollPosition:true
    }]
  };
}

function glow(parent, name, cx, cy, width, height, tint, alpha, rotation = 0) {
  const node = figma.createEllipse();
  parent.appendChild(node);
  node.name = name;
  node.resize(width, height);
  node.rotation = rotation;
  node.x = cx - width / 2;
  node.y = cy - height / 2;
  node.fills = [{
    type:"GRADIENT_RADIAL",
    gradientTransform:[[1,0,0],[0,1,0]],
    gradientStops:[
      {position:0, color:{...rgb(tint), a:alpha}},
      {position:.50, color:{...rgb(tint), a:alpha*.54}},
      {position:1, color:{...rgb(tint), a:0}}
    ]
  }];
}

function light(frame, project, phase) {
  const previous = frame.children.find(n => n.name === STUDIO);
  if (previous) previous.remove();
  const portable = frame.width < 500;
  const pc = frame.children.find(n => n.name === "Archive terminal");
  const size = pc.width;
  const cx = pc.x + .50*size;
  const floor = pc.y + .895*size;
  const wave = Math.sin(2*Math.PI*phase);
  const overlap = (1-Math.cos(2*Math.PI*phase))/2;
  const stage = figma.createFrame();
  frame.insertChild(0, stage);
  stage.name = STUDIO;
  stage.fills = [];
  stage.clipsContent = false;
  stage.resize(frame.width, frame.height);
  stage.x = 0;
  stage.y = 0;
  const diffuse = frame.width*(portable ? .94 : .70);

  glow(stage,"Rear light",cx+size*(project ? -.28 : .28),floor-size*.47,
    diffuse,size*.98,project ? "ffd68e" : "abcde0",project ? .52 : .42);
  glow(stage,"Outer shadow",cx+wave*size*.023,floor,
    size*.99,size*(.20+overlap*.027),project ? "816d58" : "657786",.31);
  if (project) {
    for (let j=0;j<3;j++) {
      glow(stage,"Refraction "+j,cx-size*.19,floor-size*(.09+(j-1)*(.084-.065*overlap)),
        diffuse*.90,size*(.074+.066*overlap),"c95a37",.30, -6+j*4);
    }
    glow(stage,"Warm edge spill",cx-size*.28,floor-size*.08,
      size*.64,size*.28,"f5ba80",.30);
  } else {
    glow(stage,"Moving desk reflection",cx+size*(.37+wave*.06),floor-size*(.085+wave*.032),
      diffuse*.86,size*.071,"72a7c2",.55,8);
    for (let j=0;j<2;j++) {
      glow(stage,"Cool band "+j,cx+size*.31,floor-size*(.147+(j-.5)*.143*(1-overlap)),
        diffuse*.72,size*.063,"9cc8dc",.48,10);
    }
    glow(stage,"Bright seam",cx+size*.32,floor-size*.147,
      diffuse*.69,size*.034,"ffffff",.77*overlap,10);
  }
  for (const x of [.17,.65]) {
    glow(stage,"Fixed foot shadow "+x,pc.x+size*x,floor+size*.02,
      size*.22,size*.057,"373b3a",.58);
  }
}

function keyboard(code) {
  return {type:"ON_KEY_DOWN", device:"KEYBOARD", keyCodes:[code]};
}

async function build() {
  const page = await figma.getNodeByIdAsync(PAGE_ID);
  const section = await figma.getNodeByIdAsync(STATE_SECTION_ID);
  if (!page || page.type !== "PAGE" || !section) throw Error("Open the shared Index Works file.");
  await figma.setCurrentPageAsync(page);
  if (page.getPluginData("studioAtmosphere") === "complete") return "Studio atmosphere is already installed.";
  const frames = page.findAll(n => n.type === "FRAME" && HOME.test(n.name));
  const named = new Map(frames.map(f => [f.name, f]));
  const groups = [];
  for (const device of ["Desktop","Phone"]) {
    for (const project of [0,1]) {
      const find = suffix => named.get(device+" · Terminal · "+project+" · "+suffix);
      const nodes = ["idle","shimmer","left","right","open","idle · Direct"].map(find);
      if (nodes.some(n => !n)) throw Error("The existing terminal flow is incomplete: "+device+" / "+project);
      groups.push({device, project, nodes});
    }
  }
  const hash = figma.createImage(figma.base64Decode(JSON.parse(__html__).machine)).hash;
  const fill = [{type:"IMAGE", scaleMode:"FILL", imageHash:hash}];
  const changedReactions = new Map(), added = [], changedFills = new Map();
  const oldStarts = page.flowStartingPoints;
  let row = 0;
  const set = async (node, reactions) => {
    if (!changedReactions.has(node)) changedReactions.set(node,node.reactions);
    await node.setReactionsAsync(reactions);
  };
  const duplicate = (frame, name) => {
    const duplicate = frame.clone();
    section.appendChild(duplicate);
    duplicate.name = name;
    duplicate.x = 41500 + (row%8)*1510;
    duplicate.y = Math.floor(row++/8)*930;
    added.push(duplicate);
    return duplicate;
  };

  try {
    const components = new Set();
    for (const f of frames) {
      const pc = f.children.find(n => n.name === "Archive terminal");
      if (pc?.type === "INSTANCE") components.add(await pc.getMainComponentAsync());
    }
    for (const part of components) {
      const housing = part?.children.find(n => n.name === "Cast housing");
      if (housing) {
        changedFills.set(housing,housing.fills);
        housing.fills = fill;
      }
    }
    const withoutTimeout = n => n.reactions.filter(r => r.trigger.type !== "AFTER_TIMEOUT");
    const lookup = new Map(groups.map(g=>[g.device+g.project,g]));
    for (const {device, project, nodes} of groups) {
      const [idle, shimmer, left, right, open, direct] = nodes;
      [idle, shimmer, left, right, open, direct].forEach((n,i)=>light(n,project,i===1?.25:0));
      const cycle=[idle,shimmer];
      for (const phase of [.5,.75]) {
        const f=duplicate(idle,device+" · Studio light · "+project+" · "+phase);
        light(f,project,phase);
        cycle.push(f);
      }
      const quarter=project?3:2;
      for (let i=0;i<cycle.length;i++) {
        const source=cycle[i], target=cycle[(i+1)%cycle.length];
        await set(source,[...withoutTimeout(source),timed(target,.018,ease(quarter))]);
      }
      const other=lookup.get(device+(1-project)).nodes[0];
      const bridge=duplicate(other,device+" · Studio lighting change · "+project);
      light(bridge,project,0);
      await set(bridge,[...withoutTimeout(other),timed(other,.025,ease(.65))]);
      for (const pressed of [left,right]) {
        await set(pressed,[
          ...withoutTimeout(pressed),
          ...[37,39].map(code=>({
            trigger:keyboard(code),actions:[{
              type:"NODE",destinationId:idle.id,navigation:"NAVIGATE",
              transition:null,resetScrollPosition:true
            }]
          })),
          timed(bridge,.10,null)
        ]);
      }
      const enter = open.reactions.find(r=>r.trigger.type==="AFTER_TIMEOUT");
      if (enter) {
        const target=await figma.getNodeByIdAsync(enter.actions[0].destinationId);
        const cue=duplicate(open,device+" · Studio entry cue · "+project);
        light(cue,project,.5);
        await set(cue,[timed(target,.04,ease(.32))]);
        await set(open,[...withoutTimeout(open),timed(cue,.10,ease(.19))]);
      }
    }
    const homeStarts=oldStarts.filter(f=>f.nodeId==="24:164"||f.nodeId==="24:390");
    page.flowStartingPoints=[...homeStarts,...oldStarts.filter(f=>!homeStarts.includes(f))];
    page.setPluginData("studioAtmosphere","complete");
    figma.viewport.scrollAndZoomIntoView([groups[0].nodes[0]]);
    return "Studio atmosphere added to the desktop and phone prototypes.";
  } catch(error) {
    for (const [node, reactions] of changedReactions) await node.setReactionsAsync(reactions);
    for (const [node, paints] of changedFills) node.fills=paints;
    for (const n of frames) n.children.find(c=>c.name===STUDIO)?.remove();
    for (const n of added) n.remove();
    page.flowStartingPoints=oldStarts;
    throw error;
  }
}

build().then(message=>figma.closePlugin(message)).catch(error=>figma.closePlugin(String(error)));
