import './style.css';
import * as THREE from 'three';

const root = document.querySelector('#game');
const loading = document.querySelector('#loading');
const loadStatus = document.querySelector('#load-status');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ac8d8);
scene.fog = new THREE.FogExp2(0x9ac8d8, 0.0019);
const camera = new THREE.PerspectiveCamera(63, innerWidth / innerHeight, 0.1, 900);
const renderer = new THREE.WebGLRenderer({antialias: !isTouch, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.35 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !isTouch;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
root.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xc5e6ff, 0x79604b, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0b0, 3.2);
sun.position.set(-100, 150, 80); sun.castShadow = !isTouch;
sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-100; sun.shadow.camera.right=100; sun.shadow.camera.top=100; sun.shadow.camera.bottom=-100; scene.add(sun);
const fill = new THREE.DirectionalLight(0x65b8d9, 0.8); fill.position.set(100,35,-100); scene.add(fill);

const mat=(color, roughness=.8, metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const materials={
  asphalt:mat(0x303941), sidewalk:mat(0xb9b4a8), sand:mat(0xd6bd8c), grass:mat(0x597b57),
  concrete:mat(0x9b9b91), white:mat(0xf1eee4), yellow:mat(0xe8b84f), glass:mat(0x4c788a,.24,.45),
  trunk:mat(0x76523a), leaf:mat(0x1c684f), teal:mat(0x1d9f9b,.3,.25), dark:mat(0x18232b,.45,.25),
  rubber:mat(0x16191b), chrome:mat(0xbccbd0,.22,.8), red:mat(0xc34435,.32,.3)
};
function box(parent, name, size, position, material, cast=false, receive=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material); m.name=name; m.position.set(...position); m.castShadow=cast; m.receiveShadow=receive; parent.add(m); return m;
}
function cylinder(parent,r1,r2,h,pos,material,segments=10){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(...pos);m.castShadow=true;parent.add(m);return m;
}
const world = new THREE.Group(); scene.add(world);
const ground=box(world,'island-ground',[620,1,620],[0,-.55,0],materials.grass); ground.receiveShadow=true;
const cityColliders=[];
function addRoad(x,z,w,d,angle=0){
 const road=box(world,'road',[w,.12,d],[x,.03,z],materials.asphalt); road.rotation.y=angle;
 // lane separators, placed as a small line of dashes
 if(w>d){ for(let xx=-w/2+7;xx<w/2-4;xx+=13) box(world,'lane-dash',[5,.025,.19],[x+xx,.105,z],materials.yellow); }
 else { for(let zz=-d/2+7;zz<d/2-4;zz+=13) box(world,'lane-dash',[.19,.025,5],[x,.105,z+zz],materials.yellow); }
}
function palm(x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);world.add(g);
 cylinder(g,.35,.55,7,[0,3.5,0],materials.trunk,9);
 const top=new THREE.Vector3(0,6.7,0);
 for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9;
   const leaf=new THREE.Mesh(new THREE.ConeGeometry(.34,4.5,5),materials.leaf);
   leaf.position.set(Math.cos(a)*1.8,6.55+Math.sin(i*2)*.22,Math.sin(a)*1.8);
   leaf.rotation.z=Math.cos(a)*.85;leaf.rotation.x=Math.sin(a)*.85;leaf.rotation.y=-a;g.add(leaf);
 }
 cylinder(g,.15,.28,.8,[0,6.5,0],materials.trunk,8);
}
function building(x,z,w,d,h,seed){
 const group=new THREE.Group(); group.position.set(x,0,z);world.add(group);
 const hue=[0xb8b8ad,0xc9bba4,0x8c9da0,0xd5d0c4,0xa6aaa5,0xe1d1b4][seed%6];
 const bodyMat=mat(hue,.86);
 const body=box(group,'building-shell',[w,h,d],[0,h/2,0],bodyMat,true);
 // Ground floor storefronts / pillars
 const floorH=Math.min(4.2,h*.18);
 box(group,'storefront-band',[w+.12,.35,d+.12],[0,floorH,0],mat(0x555b5c));
 for(let side of [-1,1]){
   for(let y=3.2;y<h-1.5;y+=3.1){
     for(let xx=-w/2+1.25;xx<w/2-0.6;xx+=2.45){
       const win=box(group,'window',[1.45,1.65,.08],[xx,y,side*(d/2+.045)],materials.glass);
       if(side===-1) win.rotation.y=Math.PI;
       box(group,'window-sill',[1.55,.1,.13],[xx,y-.88,side*(d/2+.08)],materials.concrete);
     }
   }
 }
 // Roof edge and architectural detail
 box(group,'roof-coping',[w+.35,.25,d+.35],[0,h+.08,0],materials.white);
 if(seed%3===0){
   box(group,'roof-plant',[w*.32,1.2,d*.25],[w*.18,h+.75,-d*.12],mat(0x777a76));
   box(group,'awning',[w*.8,.18,1.5],[0,3.1,d/2+.65],mat(0x268b89));
 }
 cityColliders.push({x,z,w:w+1.2,d:d+1.2,h});
}
loadStatus.textContent='Laying out roads and blocks...';
// Waterfront district, a hand-designed road grid.
addRoad(0,0,20,360); addRoad(-72,0,18,360); addRoad(72,0,18,360);
addRoad(0,-90,250,18); addRoad(0,-20,250,18); addRoad(0,52,250,18); addRoad(0,124,250,18);
addRoad(0,175,250,18);
const blockSpots=[];
for(let z=-150;z<=150;z+=72){
 for(let x=-105;x<=105;x+=58){
   if(Math.abs(x)<35 && z>-45 && z<70) continue;
   blockSpots.push([x+(Math.sin(x+z)*4),z+(Math.cos(x-z)*3)]);
 }
}
blockSpots.forEach(([x,z],i)=>{
 const w=24+(i%3)*5,d=22+((i+1)%3)*4,h=15+((i*17)%7)*5;
 building(x,z,w,d,h,i);
});
loadStatus.textContent='Adding palms, waterfront and street details...';
// Beach and ocean
box(world,'beach',[130,.25,310],[160,-.1,0],materials.sand);
const waterMat=new THREE.MeshStandardMaterial({color:0x238da5,roughness:.22,metalness:.12,transparent:true,opacity:.94});
const water=new THREE.Mesh(new THREE.PlaneGeometry(310,620,1,1),waterMat);water.rotation.x=-Math.PI/2;water.position.set(280,-.25,0);world.add(water);
// boardwalk / promenade
box(world,'promenade',[15,.35,330],[210,.05,0],mat(0xc8bfa9));
for(let z=-150;z<=150;z+=18){palm(198,z,1.0);palm(221,z+5,.8);}
// Street lights, benches, planter boxes and parking lines
for(let z=-145;z<=145;z+=28){
 for(let x of [-86,-42,42,86]){
  cylinder(world,.11,.16,5,[x,2.5,z],materials.dark,8);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),mat(0xffe5a6,.25));lamp.position.set(x,5,z);world.add(lamp);
 }
}
for(let z=-130;z<=130;z+=26){
 box(world,'bench-seat',[2.4,.18,.65],[95,.7,z],mat(0x805c3b));
 box(world,'bench-back',[2.4,.9,.14],[95,1.15,z-.25],mat(0x805c3b));
}
// A few visually distinctive landmarks
function makeFountain(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
 cylinder(g,5,5,.5,[0,.25,0],mat(0xb6b7b1),32);
 cylinder(g,3.6,4,.45,[0,.72,0],mat(0x55a8b3),32);
 cylinder(g,.5,.8,1.4,[0,1.6,0],mat(0xb6b7b1),20);
}
makeFountain(-110,90);
for(let i=0;i<12;i++){
 const x=-150+(i%4)*18,z=-130+Math.floor(i/4)*22;
 const tree=new THREE.Group();tree.position.set(x,0,z);world.add(tree);
 cylinder(tree,.35,.5,4,[0,2,0],materials.trunk,8);
 const crown=new THREE.Mesh(new THREE.SphereGeometry(2.3,10,8),materials.leaf);crown.position.y=4.1;tree.add(crown);
}
// Player and detailed starter car
const player=new THREE.Group();scene.add(player);
const skin=mat(0x9b684a), shirt=mat(0x263e4c), pants=mat(0x272d35), shoes=mat(0x171a1c);
const torso= new THREE.Mesh(new THREE.CapsuleGeometry(.48,.9,5,9),shirt);torso.position.y=1.65;torso.castShadow=true;player.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.34,14,12),skin);head.position.y=2.48;head.castShadow=true;player.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.345,12,8,0,Math.PI*2,0,Math.PI*.55),mat(0x201b18));hair.position.y=2.58;player.add(hair);
for(const side of [-1,1]){
 const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.72,4,7),pants);leg.position.set(side*.23,.68,0);leg.castShadow=true;player.add(leg);
 const foot=box(player,'shoe',[.28,.15,.45],[side*.23,.16,-.1],shoes,true);
 const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.72,4,7),shirt);arm.position.set(side*.57,1.63,0);arm.rotation.z=side*.12;player.add(arm);
}
const playerStart=new THREE.Vector3(-22,0,80);player.position.copy(playerStart);
const car=new THREE.Group();scene.add(car);
const carPaint=mat(0x167e86,.26,.55), carGlass=mat(0x253e49,.18,.5), tireMat=materials.rubber;
box(car,'lower-body',[2.15,.55,4.3],[0,.8,0],carPaint,true);
const hood=box(car,'hood',[2.05,.28,1.15],[0,1.14,-1.35],carPaint,true);
const cabin=box(car,'cabin',[1.55,.75,1.85],[0,1.47,.35],carGlass,true);
const roof=box(car,'roof',[1.42,.12,1.3],[0,1.88,.35],carPaint,true);
box(car,'front-bumper',[2.1,.18,.18],[0,.58,-2.16],materials.chrome);
box(car,'rear-bumper',[2.1,.18,.18],[0,.58,2.16],materials.chrome);
for(const s of [-1,1]){
 box(car,'headlight',[.48,.18,.08],[s*.68,1.02,-2.17],mat(0xfff2cc,.25));
 box(car,'taillight',[.4,.17,.08],[s*.7,1.02,2.17],materials.red);
 for(const z of [-1.35,1.35]){
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.27,16),tireMat);
  wheel.rotation.z=Math.PI/2;wheel.position.set(s*1.08,.55,z);wheel.castShadow=true;car.add(wheel);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.29,12),materials.chrome);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);car.add(hub);
 }
}
for(let s of [-1,1]) for(let z of [-.25,.95]){
 const window=box(car,'side-window',[.045,.45,.68],[s*.79,1.52,z],materials.glass);window.rotation.y=s*.03;
}
car.position.set(-15,0,78);car.rotation.y=Math.PI*.65;
let inCar=false, paused=false, yaw=0, pitch=.12, speed=0, verticalVelocity=0, onGround=true;
const keys={};let moveX=0,moveY=0,gas=0,steer=0,brake=0,sprinting=false;
let missionDone=false, missionDistance=0;
const marker=new THREE.Group();scene.add(marker);marker.position.set(30,0,20);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.4,.15,8,36),mat(0x44f5e8,.25,.35));ring.rotation.x=Math.PI/2;ring.position.y=.15;marker.add(ring);
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.08,.55,7,16,1,true),new THREE.MeshBasicMaterial({color:0x35e8df,transparent:true,opacity:.22,side:THREE.DoubleSide}));beam.position.y=3.5;marker.add(beam);
const markerLight=new THREE.PointLight(0x32fff0,2,20);markerLight.position.y=2;marker.add(markerLight);

function save(){
 const data={player:[player.position.x,player.position.y,player.position.z],car:[car.position.x,car.position.y,car.position.z],carYaw:car.rotation.y,missionDone,inCar};
 try{localStorage.setItem('vice-world-save-v1',JSON.stringify(data));document.querySelector('#save-status').textContent='Saved locally on this device.';}catch(e){document.querySelector('#save-status').textContent='Could not save: browser storage is unavailable.';}
}
function loadSave(){
 try{const d=JSON.parse(localStorage.getItem('vice-world-save-v1')||'null');if(!d)return;
 if(d.player?.length===3)player.position.set(...d.player);if(d.car?.length===3)car.position.set(...d.car);
 if(Number.isFinite(d.carYaw))car.rotation.y=d.carYaw;missionDone=!!d.missionDone;
 }catch(e){console.warn('Save data could not be loaded',e);}
}
loadSave();
function setMode(){
 document.querySelector('#mode-label').textContent=inCar?'DRIVING':'ON FOOT';
 document.querySelector('#interact-btn').textContent=inCar?'EXIT':'ENTER';
 document.querySelector('#drive-controls').style.display=inCar?'flex':'none';
}
function interact(){
 if(inCar){inCar=false;player.position.set(car.position.x+2,0,car.position.z);setMode();return;}
 if(player.position.distanceTo(car.position)<5){inCar=true;setMode();return;}
 document.querySelector('#hint').textContent='Find the teal sports car nearby, or walk to the cyan marker.';
}
function updateMission(){
 const d=player.position.distanceTo(new THREE.Vector3(30,0,20));
 if(!missionDone && d<5){missionDone=true;document.querySelector('#mission-title').textContent='WATERFRONT DISCOVERED';document.querySelector('#mission-desc').textContent='Great work. Your first district is yours to explore.';document.querySelector('#mission-progress').style.width='100%';document.querySelector('#hint').textContent='District discovered. Explore the waterfront or take the car for a drive.';save();}
 if(!missionDone){document.querySelector('#mission-progress').style.width=`${Math.max(4,100*(1-d/180))}%`;}
 document.querySelector('#location-name').textContent=player.position.x>135?'OCEANFRONT PROMENADE':player.position.z>80?'ARTS & RESIDENTIAL DISTRICT':player.position.z<-70?'DOWNTOWN COAST':'OCEAN DRIVE DISTRICT';
}
function collideBuildings(pos,radius=1){
 for(const b of cityColliders){
  if(pos.x>b.x-b.w/2-radius&&pos.x<b.x+b.w/2+radius&&pos.z>b.z-b.d/2-radius&&pos.z<b.z+b.d/2+radius)return true;
 }
 return false;
}
function movePlayer(dt){
 if(inCar)return;
 let mx=moveX, my=moveY;
 if(keys.KeyW||keys.ArrowUp)my-=1;if(keys.KeyS||keys.ArrowDown)my+=1;
 if(keys.KeyA||keys.ArrowLeft)mx-=1;if(keys.KeyD||keys.ArrowRight)mx+=1;
 const v=new THREE.Vector2(mx,my);if(v.length()>1)v.normalize();
 const run=sprinting||keys.ShiftLeft||keys.ShiftRight;
 const angle=yaw;
 const dx=(v.x*Math.cos(angle)-v.y*Math.sin(angle));
 const dz=(v.x*Math.sin(angle)+v.y*Math.cos(angle));
 const step=run?12:6.3;
 const next=player.position.clone();next.x+=dx*step*dt;next.z+=dz*step*dt;
 if(!collideBuildings(next)){player.position.x=THREE.MathUtils.clamp(next.x,-290,240);player.position.z=THREE.MathUtils.clamp(next.z,-290,290);}
 if(v.length()>.08){player.rotation.y=Math.atan2(dx,dz);torso.position.y=1.65+Math.sin(performance.now()*.012)*(run?.07:.025);}
 if(!onGround){verticalVelocity-=22*dt;player.position.y+=verticalVelocity*dt;if(player.position.y<=0){player.position.y=0;verticalVelocity=0;onGround=true;}}
}
function moveCar(dt){
 if(!inCar)return;
 const throttle=gas||((keys.KeyW||keys.ArrowUp)?1:0);
 const reverse=brake||((keys.KeyS||keys.ArrowDown)?1:0);
 const steerInput=steer||((keys.KeyA||keys.ArrowLeft)?-1:0)||((keys.KeyD||keys.ArrowRight)?1:0);
 speed+=throttle*17*dt;speed-=reverse*23*dt;
 speed*=Math.pow(.985,dt*60);speed=THREE.MathUtils.clamp(speed,-9,31);
 car.rotation.y-=steerInput*dt*(.85+Math.min(Math.abs(speed)/16,.8))*Math.sign(speed||1);
 const next=car.position.clone();next.x-=Math.sin(car.rotation.y)*speed*dt;next.z-=Math.cos(car.rotation.y)*speed*dt;
 if(!collideBuildings(next,1.6)){car.position.x=THREE.MathUtils.clamp(next.x,-290,240);car.position.z=THREE.MathUtils.clamp(next.z,-290,290);}else speed*=-.2;
 player.position.copy(car.position);player.position.y=0;
}
function updateCamera(dt){
 const target=inCar?car.position.clone().add(new THREE.Vector3(0,1.5,0)):player.position.clone().add(new THREE.Vector3(0,1.7,0));
 if(!isTouch && document.pointerLockElement===renderer.domElement){/* mouse updates yaw/pitch */}
 const dist=inCar?9:7;
 const desired=new THREE.Vector3(target.x+Math.sin(yaw)*dist*Math.cos(pitch),target.y+dist*Math.sin(pitch)+1.5,target.z+Math.cos(yaw)*dist*Math.cos(pitch));
 camera.position.lerp(desired,1-Math.exp(-5*dt));camera.lookAt(target);
}
function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.35:1.8));renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',onResize);
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')interact();if(e.code==='Space'&&!inCar&&onGround){verticalVelocity=8;onGround=false;}if(e.code==='Escape')togglePause(true);});
addEventListener('keyup',e=>keys[e.code]=false);
renderer.domElement.addEventListener('click',()=>{if(!isTouch&&!paused)renderer.domElement.requestPointerLock?.();});
addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement&&!paused){yaw-=e.movementX*.0025;pitch=THREE.MathUtils.clamp(pitch+e.movementY*.0015,-.15,.65);}});
function togglePause(force){paused=typeof force==='boolean'?force:!paused;document.querySelector('#pause-overlay').classList.toggle('hidden',!paused);if(paused&&document.pointerLockElement)document.exitPointerLock();}
document.querySelector('#pause-btn').onclick=()=>togglePause(true);
document.querySelector('#resume-btn').onclick=()=>togglePause(false);
document.querySelector('#save-btn').onclick=save;
document.querySelector('#interact-btn').onclick=interact;
document.querySelector('#jump-btn').onpointerdown=()=>{if(!inCar&&onGround){verticalVelocity=8;onGround=false;}};
document.querySelector('#sprint-btn').onpointerdown=()=>sprinting=true;
document.querySelector('#sprint-btn').onpointerup=()=>sprinting=false;
document.querySelector('#sprint-btn').onpointerleave=()=>sprinting=false;
document.querySelector('#gas-btn').onpointerdown=()=>gas=1;
document.querySelector('#gas-btn').onpointerup=()=>gas=0;
document.querySelector('#gas-btn').onpointerleave=()=>gas=0;
document.querySelector('#brake-btn').onpointerdown=()=>brake=1;
document.querySelector('#brake-btn').onpointerup=()=>brake=0;
document.querySelector('#brake-btn').onpointerleave=()=>brake=0;
document.querySelector('#left-btn').onpointerdown=()=>steer=-1;
document.querySelector('#left-btn').onpointerup=()=>steer=0;
document.querySelector('#left-btn').onpointerleave=()=>steer=0;
document.querySelector('#right-btn').onpointerdown=()=>steer=1;
document.querySelector('#right-btn').onpointerup=()=>steer=0;
document.querySelector('#right-btn').onpointerleave=()=>steer=0;
// Virtual joystick
const zone=document.querySelector('#stick-zone'), knob=document.querySelector('#stick-knob');
let stickActive=false, stickCenter={x:0,y:0};
function stickStart(e){stickActive=true;const r=zone.getBoundingClientRect();stickCenter={x:r.left+r.width/2,y:r.top+r.height/2};zone.setPointerCapture?.(e.pointerId);stickMove(e);}
function stickMove(e){if(!stickActive)return;const dx=e.clientX-stickCenter.x,dy=e.clientY-stickCenter.y,lim=43,len=Math.hypot(dx,dy)||1,scale=Math.min(lim,len)/len;knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;moveX=dx/lim;moveY=dy/lim;}
function stickEnd(){stickActive=false;moveX=moveY=0;knob.style.transform='translate(0,0)';}
zone.addEventListener('pointerdown',stickStart);zone.addEventListener('pointermove',stickMove);zone.addEventListener('pointerup',stickEnd);zone.addEventListener('pointercancel',stickEnd);
let cameraTouch=null;
const cameraZone=document.querySelector('#camera-zone');
cameraZone.addEventListener('pointerdown',e=>{cameraTouch={x:e.clientX,y:e.clientY};cameraZone.setPointerCapture(e.pointerId);});
cameraZone.addEventListener('pointermove',e=>{if(!cameraTouch)return;const dx=e.clientX-cameraTouch.x,dy=e.clientY-cameraTouch.y;yaw-=dx*.008;pitch=THREE.MathUtils.clamp(pitch+dy*.003,-.15,.65);cameraTouch={x:e.clientX,y:e.clientY};});
cameraZone.addEventListener('pointerup',()=>cameraTouch=null);cameraZone.addEventListener('pointercancel',()=>cameraTouch=null);
document.querySelector('#look-btn').onclick=()=>document.querySelector('#hint').textContent='Drag on the right side of the screen to rotate the camera.';
const clock=new THREE.Clock();let elapsed=0;
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(!paused){
 elapsed+=dt;marker.rotation.y+=dt*.65;ring.scale.setScalar(1+Math.sin(elapsed*2)*.06);
 movePlayer(dt);moveCar(dt);updateCamera(dt);updateMission();
 water.position.y=-.25+Math.sin(elapsed*.7)*.035;
 }
 renderer.render(scene,camera);
}
setMode();updateCamera(.1);animate();
setTimeout(()=>{loading.classList.add('fade');setTimeout(()=>loading.remove(),650);},800);
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(e=>console.warn('Offline cache registration failed',e)));}
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
