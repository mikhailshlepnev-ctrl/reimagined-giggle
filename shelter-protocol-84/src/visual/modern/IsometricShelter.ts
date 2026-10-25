import {Viewport, type ViewPoint} from '../renderer/Viewport';
import type {GameState} from '../../core/State';
import buildings from '../../config/buildings.json';
export interface Room {id:string;module:string;name:string;level:number;x:number;y:number;kind:string;condition:number}
const info=buildings as Record<string,any>;
const bases=[['gate','Шлюз и приём','integrity'],['habitat','Жилой блок','capacity'],['power','Энергоузел','power'],['water','Водный контур','water'],['control','Диспетчерская','intel'],['storage','Склад снабжения','storage']];
export function roomsFor(state:Readonly<GameState>):Room[]{
 const records=bases.map(([module,name,kind])=>({id:'base:'+module,module:'',name,level:1,kind}));
 for(const module of Object.keys(state.built).sort()){const total=state.built[module],kind=Object.keys(info[module]?.effect||{})[0]||'workshop';for(let level=1;level<=Math.min(total,3);level++)records.push({id:module+':'+level,module,name:info[module]?.name||module,level,kind});if(total>3)records.push({id:module+':group',module,name:(info[module]?.name||module)+' · '+(total-3)+' секц.',level:total,kind});}
 const condition=(state.physical as any)?.condition||{};
 return records.map((r,i)=>({...r,x:i%3*188,y:Math.floor(i/3)*153,condition:Math.max(0,Math.min(1,condition[r.kind]??1))}));
}
/** All motion is cosmetic and uses time/hash only; never consumes simulation RNG. */
export class IsometricShelter {
 private context:CanvasRenderingContext2D;
 private viewport:Viewport;
 private observer:ResizeObserver;
 private frame=0;private last=0;private width=1;private height=1;private dpr=1;
 private state:Readonly<GameState>;private rooms:Room[]=[];private selected='';private disposed=false;
 private reduced=matchMedia('(prefers-reduced-motion: reduce)');private texture:CanvasPattern;
 constructor(private canvas:HTMLCanvasElement,state:Readonly<GameState>,private select:(room:Room)=>void){
  this.state=state;this.context=canvas.getContext('2d')!;
  const tile=document.createElement('canvas');tile.width=128;tile.height=128;const tc=tile.getContext('2d')!;tc.fillStyle='#29302e';tc.fillRect(0,0,128,128);
  for(let i=0;i<950;i++){tc.fillStyle=i%2?'#ffffff07':'#00000018';tc.fillRect(this.hash(i)*128,this.hash(i+911)*128,1+this.hash(i+2)*3,1);}
  this.texture=this.context.createPattern(tile,'repeat')!;
  this.viewport=new Viewport(canvas,{onChange:()=>this.request(),onSelect:p=>this.hit(p)});
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.update(state);this.resize();this.fit();this.request();
 }
 private hash(n:number){const x=Math.sin(n*127.1+17.3)*43758.5453;return x-Math.floor(x);}
 private point(x:number,y:number,z=0):ViewPoint{return {x:(x-y)*.86,y:(x+y)*.43-z};}
 private poly(points:ViewPoint[],fill:string|CanvasPattern|CanvasGradient,stroke?:string){const c=this.context;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
 private line(a:ViewPoint,b:ViewPoint,color:string,width=1){const c=this.context;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
 private glow(p:ViewPoint,r:number,color:string){const c=this.context,g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(p.x-r,p.y-r,r*2,r*2);}
 private box(x:number,y:number,w:number,d:number,h:number,color:string){const a=this.point(x,y),b=this.point(x+w,y),e=this.point(x,y+d),f=this.point(x+w,y+d);const top=(p:ViewPoint)=>({x:p.x,y:p.y-h});this.poly([a,b,top(b),top(a)],'#202b29','#0d1413');this.poly([b,f,top(f),top(b)],color,'#111917');this.poly([top(a),top(b),top(f),top(e)],color,'#a4b5a22b');}
 private room(room:Room,t:number){
  const c=this.context,{x,y}=room,active=room.id===this.selected,power=(this.state.physical as any)?.lastServices?.power!==undefined?(this.state.physical as any).lastServices.power>.25:(this.state.bunker.power||0)>5&&(this.state.resources.fuel||0)>0;
  const p=(a:number,b:number,z=0)=>this.point(x+a,y+b,z),wall=47;
  this.poly([p(-8,-8,-15),p(166,-8,-15),p(166,131,-15),p(-8,131,-15)],'#080d0c');
  this.poly([p(0,0),p(160,0),p(160,125),p(0,125)],this.texture,'#647569');
  for(let a=0;a<160;a+=27)this.line(p(a,0),p(a,125),'#0c17182e');for(let b=0;b<125;b+=25)this.line(p(0,b),p(160,b),'#78908319');
  const shade=c.createLinearGradient(p(0,0,wall).x,p(0,0,wall).y,p(160,125).x,p(160,125).y);shade.addColorStop(0,'#63746a');shade.addColorStop(.4,'#404e48');shade.addColorStop(1,'#202c28');
  this.poly([p(0,0),p(0,0,wall),p(160,0,wall),p(160,0)],shade,'#a8b4a140');this.poly([p(0,0),p(0,125),p(0,125,wall),p(0,0,wall)],'#3b4942','#86958355');
  for(let a=16;a<160;a+=32)this.line(p(a,0,wall-3),p(a,0,4),'#141e1b66');
  for(let b=22;b<125;b+=34)this.line(p(0,b,wall-3),p(0,b,3),'#131e1a77');
  this.line(p(9,0,38),p(151,0,38),power?'#d4c399':'#5e6457',3);if(power)this.glow(p(80,26,14),70,'#eac78a22');
  // A recessed door and external service conduit.
  this.poly([p(0,72),p(0,104),p(0,104,35),p(0,72,35)],'#192420','#7c897455');this.line(p(0,90,7),p(0,90,29),'#8b9d84',2);
  this.line(p(12,4,26),p(146,4,26),'#897d58',2);
  const kind=room.module||room.kind;
  if(/habitat|capacity|shelterWard|reception/.test(kind)){
   for(let i=0;i<3;i++){this.box(x+18+i*43,y+18,26,47,9,'#6d7d6b');this.box(x+19+i*43,y+18,25,13,12,'#a1ad91');this.line(p(18+i*43,68),p(43+i*43,68),'#a0926d',2);}
  }else if(/water|decon|thermal/.test(kind)){
   for(let i=0;i<3;i++){const q=p(34+i*43,34);this.box(x+20+i*43,y+21,26,28,32,'#526f6a');c.fillStyle='#88b4a0';c.beginPath();c.ellipse(q.x,q.y-30,14,6,0,0,Math.PI*2);c.fill();this.line(p(34+i*43,48),p(34+i*43,96),'#9eab83',4);}
  }else if(/power|solar|energy/.test(kind)){
   for(let i=0;i<3;i++){this.box(x+18+i*45,y+22,30,46,24,'#69705a');const q=p(31+i*45,45,27);c.strokeStyle='#161f1d';c.lineWidth=3;c.beginPath();c.arc(q.x,q.y,8,0,Math.PI*2);c.stroke();c.save();c.translate(q.x,q.y);c.rotate((power?t*.9:0)+i);for(let j=0;j<3;j++){c.rotate(Math.PI*2/3);c.fillStyle='#a9ab88';c.fillRect(-2,-7,4,9);}c.restore();}
  }else if(/food|farm|greenhouse/.test(kind)){
   for(let i=0;i<4;i++){this.box(x+17+i*33,y+20,23,72,8,'#526548');for(let j=0;j<5;j++){const q=p(27+i*33,30+j*12,11);c.fillStyle=j%2?'#79965d':'#9cad70';c.beginPath();c.ellipse(q.x,q.y,4,3,0,0,7);c.fill();}}
  }else if(/med|pharma|bio|quarantine/.test(kind)){
   this.box(x+23,y+21,70,32,14,'#9da993');this.box(x+111,y+18,26,27,31,'#6f8b7e');const q=p(81,0,23);c.fillStyle='#cbcfad';c.fillRect(q.x-2,q.y-9,4,17);c.fillRect(q.x-8,q.y-3,16,4);
  }else if(/control|intel|radio|knowledge/.test(kind)){
   for(let i=0;i<3;i++){this.box(x+25+i*40,y+22,30,19,16,'#49605a');const q=p(39+i*40,26,29);this.poly([{x:q.x-10,y:q.y-7},{x:q.x+7,y:q.y-1},{x:q.x+7,y:q.y+11},{x:q.x-10,y:q.y+5}],power?'#6eb9a6':'#263c35');if(power)this.glow(q,18,'#68dcc624');}
   this.box(x+49,y+76,52,26,14,'#6e7056');
  }else if(kind==='gate'||kind==='integrity'){
   this.box(x+47,y+30,60,19,36,'#54635d');for(let i=0;i<5;i++)this.line(p(47+i*12,51,27),p(54+i*12,51,34),'#ccb66a',3);
  }else{
   for(let i=0;i<4;i++){const a=23+(i%2)*65,b=20+Math.floor(i/2)*45;this.box(x+a,y+b,38,25,14+(i%2)*5,'#72765b');this.line(p(a+4,b+25,8),p(a+33,b+25,8),'#adab7c',2);}
  }
  // Inhabitants follow cosmetic paths; visible number is a representative sample.
  const index=this.rooms.indexOf(room),sample=Math.max(0,Math.floor(this.state.population)),count=Math.min(3,Math.floor(sample/this.rooms.length)+(index<sample%this.rooms.length?1:0));
  for(let i=0;i<count;i++){const phase=t*(.11+i*.025)+this.hash(room.x+room.y+i)*6.28,px=30+(Math.sin(phase)*.5+.5)*95,py=80+Math.sin(phase*.8+i)*20,q=p(px,py);c.fillStyle='#0007';c.beginPath();c.ellipse(q.x,q.y+3,7,3,0,0,7);c.fill();const stride=Math.sin(t*7+i)*2;this.line({x:q.x-2,y:q.y-3},{x:q.x-3+stride,y:q.y+2},'#171f22',3);this.line({x:q.x+2,y:q.y-3},{x:q.x+3-stride,y:q.y+2},'#171f22',3);this.line({x:q.x,y:q.y-13},{x:q.x,y:q.y-3},i===1?'#9b9a71':'#668c90',7);c.fillStyle='#b7ad8b';c.beginPath();c.arc(q.x,q.y-17,3.5,0,7);c.fill();}
  if(room.condition<.55){const q=p(110,55,30);this.glow(q,32,'#ef764c44');for(let i=0;i<4;i++){const f=(t*.2+i*.25)%1;c.fillStyle=`rgba(160,166,155,${(1-f)*.25})`;c.beginPath();c.arc(q.x+Math.sin(t+i)*9,q.y-f*60,4+f*11,0,7);c.fill();}}
  this.line(p(0,125),p(160,125),active?'#efc780':'#86937a',active?3:2);this.line(p(160,0),p(160,125),active?'#efc780':'#86937a',active?3:2);
  const label=p(80,135);c.font='11px system-ui';c.textAlign='center';c.fillStyle=active?'#ffe2a4':'#bdc7b6';c.fillText(room.name.length>24?room.name.slice(0,23)+'…':room.name,label.x,label.y+11);c.font='9px monospace';c.fillStyle='#81958b';c.fillText(room.module?'МОДУЛЬ '+room.level:'ОСНОВНОЙ КОНТУР',label.x,label.y+24);
 }
 /** The shell follows the installed rooms; it never creates capacity or protection. */
 private enclosure(front=false){
  const c=this.context,maxX=Math.max(...this.rooms.map(r=>r.x))+160,maxY=Math.max(...this.rooms.map(r=>r.y))+125;
  const p=(x:number,y:number,z=0)=>this.point(x,y,z);
  if(!front){
   this.poly([p(-24,-24,-20),p(maxX+24,-24,-20),p(maxX+24,maxY+24,-20),p(-24,maxY+24,-20)],'#252f29','#141a16');
   this.poly([p(-24,-24),p(maxX+24,-24),p(maxX+24,-24,62),p(-24,-24,62)],'#3a4338','#85917a');
   this.poly([p(-24,-24),p(-24,maxY+24),p(-24,maxY+24,62),p(-24,-24,62)],'#313b32','#71836c');
   this.line(p(-24,-24,65),p(maxX+24,-24,65),'#9a9e7b',5);this.line(p(-24,-24,65),p(-24,maxY+24,65),'#727e64',5);
   for(let x=5;x<maxX;x+=50){const q=p(x,-24,38);c.fillStyle='#111b16';c.beginPath();c.arc(q.x,q.y,2.3,0,7);c.fill();}
   for(let y=5;y<maxY;y+=50){const q=p(-24,y,38);c.fillStyle='#131d16';c.beginPath();c.arc(q.x,q.y,2.3,0,7);c.fill();}
  }else{
   this.poly([p(-24,maxY+24,-20),p(maxX+24,maxY+24,-20),p(maxX+24,maxY+24,2),p(-24,maxY+24,2)],'#303d32','#86917a');
   this.poly([p(maxX+24,-24,-20),p(maxX+24,maxY+24,-20),p(maxX+24,maxY+24,2),p(maxX+24,-24,2)],'#3c4837','#8a9579');
   this.line(p(-24,maxY+24,3),p(maxX+24,maxY+24,3),'#b3ad7a',3);this.line(p(maxX+24,-24,3),p(maxX+24,maxY+24,3),'#9c9e73',3);
  }
 }
 private hit(p:ViewPoint){for(const room of [...this.rooms].reverse()){const a=(p.x/.86+p.y/.43)/2-room.x,b=(p.y/.43-p.x/.86)/2-room.y;if(a>=0&&a<=160&&b>=-35&&b<=135){this.selected=room.id;this.select(room);this.request();return;}}}
 clearSelection(){this.selected='';this.request();}
 selectRoom(id:string){const r=this.rooms.find(r=>r.id===id);if(r){this.selected=id;this.select(r);this.request();}}
 update(state:Readonly<GameState>){this.state=state;const old=this.rooms.length;this.rooms=roomsFor(state);if(old!==this.rooms.length&&this.width>1)this.fit();this.request();}
 fit(){if(!this.rooms.length)return;const ps=this.rooms.flatMap(r=>[this.point(r.x,r.y,65),this.point(r.x+170,r.y,65),this.point(r.x,r.y+150,-35),this.point(r.x+170,r.y+150,-35)]),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y);this.viewport.fit({x:Math.min(...xs)-90,y:Math.min(...ys)-70,width:Math.max(...xs)-Math.min(...xs)+180,height:Math.max(...ys)-Math.min(...ys)+140},35);}
 zoom(factor:number){this.viewport.zoomBy(factor);}
 private resize(){const box=this.canvas.getBoundingClientRect();this.width=box.width;this.height=box.height;this.dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=Math.max(1,Math.round(this.width*this.dpr));this.canvas.height=Math.max(1,Math.round(this.height*this.dpr));this.viewport.resize(this.width,this.height);this.fit();}
 private request(){if(!this.frame&&!this.disposed)this.frame=requestAnimationFrame(t=>this.draw(t));}
 private draw(ts:number){this.frame=0;if(this.disposed)return;if(document.hidden){this.last=0;setTimeout(()=>this.request(),500);return;}if(!this.reduced.matches&&ts-this.last<40){this.request();return;}this.last=ts;const c=this.context,t=this.reduced.matches?0:ts/1000;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);const sky=c.createLinearGradient(0,0,0,this.height);sky.addColorStop(0,'#151c18');sky.addColorStop(.5,'#111914');sky.addColorStop(1,'#080e0c');c.fillStyle=sky;c.fillRect(0,0,this.width,this.height);c.save();this.viewport.apply(c);
  const extent=Math.max(700,this.rooms.length*28);this.poly([{x:-extent,y:40},{x:extent,y:40},{x:extent,y:extent+500},{x:-extent,y:extent+500}],'#121d1b');
  for(let i=0;i<240;i++){c.fillStyle=i%2?'#85927b0b':'#00000030';c.fillRect((this.hash(i)-.5)*extent*2,50+this.hash(i+555)*(extent+450),12+this.hash(i+8)*25,1);}
  this.enclosure();
  for(const room of this.rooms){const q=(a:number,b:number)=>this.point(room.x+a,room.y+b);if(room.x/188<2&&this.rooms.some(r=>r.x===room.x+188&&r.y===room.y))this.poly([q(160,45),q(188,45),q(188,85),q(160,85)],'#435047','#7a866944');if(this.rooms.some(r=>r.y===room.y+153&&r.x===room.x))this.poly([q(50,125),q(95,125),q(95,153),q(50,153)],'#435047','#7a866944');}
  [...this.rooms].sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(room=>this.room(room,t));this.enclosure(true);c.restore();
  const vignette=c.createRadialGradient(this.width/2,this.height/2,100,this.width/2,this.height/2,Math.max(this.width,this.height)*.7);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#030a0dbb');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);if(!this.reduced.matches)this.request();
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.viewport.dispose();this.observer.disconnect();}
}
