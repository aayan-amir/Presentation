import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import validator from 'gltf-validator';

const glb = await readFile(new URL('../public/works/terminal.glb',import.meta.url));
const report = await validator.validateBytes(new Uint8Array(glb),{uri:'terminal.glb'});
assert.equal(report.issues.numErrors,0,JSON.stringify(report.issues.messages,null,2));
const scene=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
const nodes=new Map(scene.nodes.map(node=>[node.name,node]));
for(const name of ['TerminalRoot','Housing','CRT_Glass','CRT_Display','Key_Left','Key_Enter','Key_Right']){
  assert.ok(nodes.has(name),'Missing '+name);
}
for(const name of ['Key_Left','Key_Enter','Key_Right']){
  assert.ok(nodes.get(name).children?.length,'Unbound pivot '+name);
}
const screen=scene.meshes[nodes.get('CRT_Display').mesh];
assert.ok(screen.primitives.every(part=>part.attributes.TEXCOORD_0!==undefined),'Missing screen UVs');
assert.ok(glb.byteLength<2_000_000,'Terminal model exceeds 2 MB');
console.log(JSON.stringify({bytes:glb.byteLength,drawCalls:report.info?.drawCallCount,triangles:report.info?.totalTriangleCount,warnings:report.issues.numWarnings},null,2));
