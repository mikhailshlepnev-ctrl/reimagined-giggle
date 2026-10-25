/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.primeScenarioImages = function primeScenarioImages(){__ctx.entries(__ctx.scenarioVisuals).forEach(([k,v])=>{const img: any=new Image();img.decoding='async';img.src=v.image;__ctx.scenarioImageCache[k]=img;});};

__ctx.getScenarioImage = function getScenarioImage(key){return __ctx.scenarioImageCache[key]&&__ctx.scenarioImageCache[key].complete?__ctx.scenarioImageCache[key]:null;};

__ctx.initCinematics = function initCinematics(){__ctx.cinematicEngine.canvas=__ctx.browser.document.getElementById('cinematicCanvas');if(!__ctx.cinematicEngine.canvas)return;__ctx.cinematicEngine.ctx=__ctx.cinematicEngine.canvas.getContext('2d');const fit=()=>{const d=Math.min(2,__ctx.browser.window.devicePixelRatio||1);__ctx.cinematicEngine.dpr=d;__ctx.cinematicEngine.w=innerWidth;__ctx.cinematicEngine.h=innerHeight;__ctx.cinematicEngine.canvas.width=Math.round(innerWidth*d);__ctx.cinematicEngine.canvas.height=Math.round(innerHeight*d);__ctx.cinematicEngine.ctx.setTransform(d,0,0,d,0,0);};fit();addEventListener('resize',fit,{passive:true});requestAnimationFrame(__ctx.animateCinematic);};

__ctx.showCinematic = function showCinematic({kicker='',title='',text='',sub='',duration=3200,type='phase'}: any={}){const el=__ctx.browser.document.getElementById('cinematicOverlay');if(!el||!__ctx.viewState.scenario)return;__ctx.cinematicEngine.active=true;__ctx.cinematicEngine.kicker=kicker;__ctx.cinematicEngine.title=title;__ctx.cinematicEngine.text=text;__ctx.cinematicEngine.sub=sub;__ctx.cinematicEngine.type=type;__ctx.cinematicEngine.until=performance.now()+duration;__ctx.browser.document.getElementById('cinematicKicker').textContent=kicker;__ctx.browser.document.getElementById('cinematicTitle').textContent=title;__ctx.browser.document.getElementById('cinematicText').textContent=text;__ctx.browser.document.getElementById('cinematicSub').textContent=sub;__ctx.browser.document.body.dataset.cinematic=type;el.classList.add('show');el.setAttribute('aria-hidden','false');clearTimeout(__ctx.showCinematic._timer);__ctx.showCinematic._timer=setTimeout(__ctx.hideCinematic,duration);};

__ctx.hideCinematic = function hideCinematic(){const el=__ctx.browser.document.getElementById('cinematicOverlay');if(!el)return;__ctx.cinematicEngine.active=false;el.classList.remove('show');el.setAttribute('aria-hidden','true');__ctx.browser.document.body.dataset.cinematic='';};

__ctx.animateCinematic = function animateCinematic(ts){const ctx=__ctx.cinematicEngine.ctx;if(!ctx){requestAnimationFrame(__ctx.animateCinematic);return;}const w=__ctx.cinematicEngine.w,h=__ctx.cinematicEngine.h;ctx.clearRect(0,0,w,h);if(__ctx.cinematicEngine.active&&__ctx.viewState.scenario){const sc=__ctx.viewState.scenario,hz=__ctx.clamp(__ctx.viewState.hazard||0,0,100),stage=__ctx.viewState.settlementLevel||0;const img=__ctx.getScenarioImage(sc);if(img){const scale=1.12+Math.sin(ts*.00018)*.02;const dw=w*scale,dh=h*scale;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);}else{const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#243544');g.addColorStop(1,'#090f14');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,w,h);__ctx.drawScenarioEffects(ctx,w,h,sc,hz,ts,.95);__ctx.drawSettlementArchitecture(ctx,w,h,stage,sc,ts,false);__ctx.drawScenarioStageSignature(ctx,w,h,stage,sc,ts,false);if(__ctx.cinematicEngine.type==='crisis'||__ctx.cinematicEngine.type==='collapse'){ctx.fillStyle='rgba(255,70,70,.06)';ctx.fillRect(0,0,w,h);}if(__ctx.cinematicEngine.type==='victory'){ctx.fillStyle='rgba(170,255,210,.08)';ctx.fillRect(0,0,w,h);}ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;for(let y=0;y<h;y+=4){ctx.globalAlpha=.04;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.globalAlpha=1;}requestAnimationFrame(__ctx.animateCinematic);};

__ctx.spawnParticle = function spawnParticle(){
 const h=__ctx.fxEngine.hazard||0, sc=__ctx.fxEngine.scenario;
 if(!sc) return;
 if(sc==='ice') return {x:Math.random()*__ctx.fxEngine.w,y:-12,size:1+Math.random()*3.4,vx:-.8-Math.random()*2.6-h*.015,vy:1.5+Math.random()*3+h*.02,life:1,rot:Math.random()*6.2};
 if(sc==='heat') return {x:Math.random()*__ctx.fxEngine.w,y:__ctx.fxEngine.h+8,size:.6+Math.random()*2.2,vx:-.5+Math.random()*1.8,vy:-.25-Math.random()*1.4-h*.004,life:.5+Math.random()*.5,rot:Math.random()*6.2};
 if(sc==='epidemic') return {x:Math.random()*__ctx.fxEngine.w,y:-8,size:1.2+Math.random()*3.2,vx:-.4+Math.random()*1.0,vy:.25+Math.random()*1.1+h*.005,life:.5+Math.random()*.5,rot:Math.random()*6.2};
 return {x:Math.random()*__ctx.fxEngine.w,y:-8,size:.7+Math.random()*2.6,vx:-.2+Math.random()*1.2,vy:.4+Math.random()*1.8+h*.009,life:.65+Math.random()*.35,rot:Math.random()*6.2};
};

__ctx.animateFX = function animateFX(t){
 const ctx=__ctx.fxEngine.ctx; if(!ctx){requestAnimationFrame(__ctx.animateFX);return}
 const dt=Math.min(2.2,(t-__ctx.fxEngine.last)/16.67||1); __ctx.fxEngine.last=t; ctx.clearRect(0,0,__ctx.fxEngine.w,__ctx.fxEngine.h);
 const target=Math.round((18+__ctx.fxEngine.hazard*1.65)*(__ctx.fxEngine.scenario==='ice'?1.2:1));
 while(__ctx.fxEngine.particles.length<target){const p=__ctx.spawnParticle();if(p)__ctx.fxEngine.particles.push(p);else break}
 while(__ctx.fxEngine.particles.length>target+20) __ctx.fxEngine.particles.shift();
 for(let i=__ctx.fxEngine.particles.length-1;i>=0;i--){
   const p=__ctx.fxEngine.particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=.015*dt;
   if(__ctx.fxEngine.scenario==='ice'){
     ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.strokeStyle=`rgba(225,245,255,${.20+p.life*.55})`;ctx.lineWidth=Math.max(.6,p.size*.45);ctx.beginPath();ctx.moveTo(-p.size*1.7,0);ctx.lineTo(p.size*1.7,0);ctx.stroke();ctx.restore();
   }else if(__ctx.fxEngine.scenario==='heat'){
     ctx.fillStyle=`rgba(236,178,105,${.07+p.life*.18})`;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
   }else if(__ctx.fxEngine.scenario==='epidemic'){
     ctx.strokeStyle=`rgba(145,255,210,${.10+p.life*.30})`;ctx.lineWidth=Math.max(.5,p.size*.24);ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-p.size*.75,p.y);ctx.lineTo(p.x+p.size*.75,p.y);ctx.moveTo(p.x,p.y-p.size*.75);ctx.lineTo(p.x,p.y+p.size*.75);ctx.stroke();
   }else{
     ctx.fillStyle=`rgba(${Math.random()>.82?'210,235,158':'155,165,145'},${.10+p.life*.25})`;ctx.fillRect(p.x,p.y,p.size,p.size);
   }
   const off=p.y>__ctx.fxEngine.h+20||p.y<-30||p.x<-40||p.x>__ctx.fxEngine.w+40;
   if(off){__ctx.fxEngine.particles[i]=__ctx.spawnParticle()||p; if(__ctx.fxEngine.scenario==='heat')__ctx.fxEngine.particles[i].y=__ctx.fxEngine.h+8; else __ctx.fxEngine.particles[i].y=-10;}
 }
 requestAnimationFrame(__ctx.animateFX);
};

__ctx.accentForScenario = function accentForScenario(sc){return sc==='ice'?'#e6fbff':sc==='heat'?'#ffd088':sc==='nuclear'?'#d9ff90':'#aef6d7'};

__ctx.drawScenarioImage = function drawScenarioImage(ctx,w,h,sc,alpha=.72){const img=__ctx.getScenarioImage(sc);if(img){ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,0,0,w,h);ctx.restore();return true}return false};

__ctx.drawSettlementArchitecture = function drawSettlementArchitecture(ctx,w,h,stage,sc,ts,compact=false){
 const p=compact?.7:1, baseX=w*(compact?.18:.15), baseY=h*(compact?.80:.78), accent=__ctx.accentForScenario(sc);
 const pulse=(Math.sin(ts*.0032)+1)/2, pulse2=(Math.sin(ts*.0018+1.2)+1)/2;
 ctx.save();
 // service road
 ctx.strokeStyle='rgba(190,205,220,.38)'; ctx.lineWidth=3*p; ctx.beginPath(); ctx.moveTo(0,baseY+14*p); ctx.lineTo(baseX+62*p,baseY-5*p); ctx.lineTo(baseX+150*p,baseY-18*p); ctx.stroke();
 // main bunker
 ctx.fillStyle='rgba(8,18,26,.82)'; ctx.beginPath(); ctx.moveTo(baseX,baseY); ctx.arc(baseX+38*p,baseY,38*p,Math.PI,0); ctx.lineTo(baseX+76*p,baseY+28*p); ctx.lineTo(baseX,baseY+28*p); ctx.closePath(); ctx.fill();
 ctx.strokeStyle=accent; ctx.lineWidth=2*p; ctx.stroke();
 ctx.fillStyle=accent; ctx.globalAlpha=.42+.22*pulse; ctx.fillRect(baseX+12*p,baseY-2*p,18*p,11*p); ctx.fillRect(baseX+35*p,baseY-2*p,18*p,11*p); ctx.globalAlpha=1;
 // stage 1: floodlight and entrance activity
 if(stage>=1){ctx.strokeStyle='rgba(230,240,255,.72)'; ctx.lineWidth=2*p; ctx.beginPath(); ctx.moveTo(baseX+88*p,baseY+28*p); ctx.lineTo(baseX+88*p,baseY-44*p); ctx.stroke(); ctx.fillStyle='rgba(255,244,188,'+(.24+.22*pulse)+')'; ctx.beginPath(); ctx.moveTo(baseX+88*p,baseY-44*p); ctx.lineTo(baseX+132*p,baseY-28*p); ctx.lineTo(baseX+88*p,baseY-8*p); ctx.closePath(); ctx.fill();}
 // stage 2: greenhouse dome + utilities
 if(stage>=2){ctx.fillStyle='rgba(72,100,116,.68)'; ctx.beginPath(); ctx.arc(baseX+128*p,baseY+8*p,26*p,Math.PI,0); ctx.lineTo(baseX+154*p,baseY+8*p); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(145,255,185,.9)'; ctx.stroke(); for(let i=0;i<4;i++){ctx.strokeStyle='rgba(140,220,160,.28)'; ctx.beginPath(); ctx.moveTo(baseX+108*p+i*12*p,baseY+8*p); ctx.lineTo(baseX+116*p+i*10*p,baseY-12*p); ctx.stroke();}}
 // stage 3: habitat modules and moving vehicle
 if(stage>=3){for(let i=0;i<2;i++){const x=baseX+164*p+i*44*p; ctx.fillStyle='rgba(18,30,40,.82)'; ctx.fillRect(x,baseY-20*p,34*p,26*p); ctx.strokeStyle='rgba(186,212,228,.5)'; ctx.strokeRect(x,baseY-20*p,34*p,26*p); ctx.fillStyle='rgba(150,212,255,'+(.3+.3*((pulse+i*.23)%1))+')'; ctx.fillRect(x+6*p,baseY-13*p,8*p,8*p); ctx.fillStyle='rgba(255,212,145,'+(.32+.28*((pulse2+i*.19)%1))+')'; ctx.fillRect(x+18*p,baseY-13*p,8*p,8*p);} const vx=(ts*.02)%(86*p); ctx.fillStyle='rgba(20,30,38,.95)'; ctx.fillRect(baseX+12*p+vx,baseY+16*p,20*p,8*p); ctx.fillRect(baseX+15*p+vx,baseY+10*p,12*p,8*p);}
 // stage 4: tower and cable links
 if(stage>=4){const tx=baseX+272*p; ctx.strokeStyle='rgba(190,255,220,.8)'; ctx.lineWidth=2*p; ctx.beginPath(); ctx.moveTo(tx,baseY+8*p); ctx.lineTo(tx,baseY-78*p); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tx-22*p,baseY-44*p); ctx.lineTo(tx+22*p,baseY-44*p); ctx.stroke(); ctx.fillStyle='rgba(160,255,224,'+(.35+.28*pulse)+')'; ctx.beginPath(); ctx.arc(tx,baseY-78*p,6*p,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(170,210,230,.35)'; ctx.beginPath(); ctx.moveTo(baseX+76*p,baseY-20*p); ctx.lineTo(tx,baseY-44*p); ctx.stroke();}
 // stage 5: skyline, drones, civic glow
 if(stage>=5){for(let i=0;i<4;i++){const bx=baseX+210*p+i*28*p, bh=24*p+(i%3)*10*p; ctx.fillStyle='rgba(14,24,32,.82)'; ctx.fillRect(bx,baseY-bh,18*p,bh+6*p); ctx.fillStyle='rgba(255,223,164,'+(.18+.22*((pulse+i*.17)%1))+')'; ctx.fillRect(bx+4*p,baseY-bh+6*p,3*p,3*p); ctx.fillRect(bx+10*p,baseY-bh+12*p,3*p,3*p);} for(let i=0;i<2;i++){const dx=baseX+190*p+Math.sin(ts*.0017+i)*32*p, dy=baseY-95*p+Math.cos(ts*.0021+i)*10*p; ctx.fillStyle='rgba(170,255,236,.95)'; ctx.beginPath(); ctx.arc(dx,dy,3.5*p,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(170,255,236,.18)'; ctx.beginPath(); ctx.arc(dx,dy,10*p+4*p*pulse,0,Math.PI*2); ctx.stroke();}}
 // scenario-specific set dressing
 if(sc==='ice'){ctx.fillStyle='rgba(236,246,255,.22)'; ctx.fillRect(baseX-8*p,baseY+28*p,150*p,8*p);}
 if(sc==='heat'){ctx.strokeStyle='rgba(255,190,120,.35)'; for(let i=0;i<3;i++){const yy=baseY-34*p+i*10*p; ctx.beginPath(); ctx.moveTo(baseX-18*p,yy); ctx.bezierCurveTo(baseX+30*p,yy-6*p,baseX+70*p,yy+8*p,baseX+120*p,yy); ctx.stroke();}}
 if(sc==='nuclear'){ctx.strokeStyle='rgba(194,255,125,.44)'; ctx.strokeRect(baseX-8*p,baseY-10*p,98*p,48*p);}
 if(sc==='epidemic'){ctx.strokeStyle='rgba(145,255,220,.44)'; ctx.strokeRect(baseX+96*p,baseY-28*p,72*p,38*p); ctx.fillStyle='rgba(145,255,220,'+(.12+.12*pulse)+')'; ctx.fillRect(baseX+96*p,baseY-28*p,72*p,38*p);}
 ctx.restore();
};

__ctx.drawScenarioStageSignature = function drawScenarioStageSignature(ctx,w,h,stage,sc,ts,compact=false){const p=compact?.75:1,baseX=w*(compact?.18:.15),baseY=h*(compact?.80:.78),pulse=(Math.sin(ts*.003)+1)/2;ctx.save(); if(sc==='ice'){if(stage>=1){ctx.fillStyle='rgba(255,188,112,'+(.22+.2*pulse)+')';ctx.fillRect(baseX-18*p,baseY+6*p,10*p,10*p);} if(stage>=2){ctx.strokeStyle='rgba(180,235,255,.6)';ctx.lineWidth=2*p;ctx.beginPath();ctx.moveTo(baseX+70*p,baseY+32*p);ctx.lineTo(baseX+148*p,baseY+32*p);ctx.stroke();} if(stage>=3){const x=baseX+158*p+Math.sin(ts*.0015)*16*p;ctx.fillStyle='rgba(25,36,44,.92)';ctx.fillRect(x,baseY+12*p,22*p,8*p);ctx.fillStyle='rgba(220,245,255,.7)';ctx.fillRect(x+3*p,baseY+8*p,7*p,4*p);} if(stage>=4){ctx.strokeStyle='rgba(210,245,255,.26)';for(let i=0;i<3;i++)ctx.strokeRect(baseX-20*p+i*8*p,baseY-20*p-i*4*p,18*p,36*p);} if(stage>=5){ctx.strokeStyle='rgba(128,220,255,.25)';ctx.beginPath();ctx.moveTo(0,h*.18);for(let x=16;x<=w;x+=16)ctx.lineTo(x,h*.18+Math.sin(x*.02+ts*.001)*10);ctx.stroke();}} if(sc==='heat'){if(stage>=1){ctx.strokeStyle='rgba(255,198,132,.45)';ctx.strokeRect(baseX-6*p,baseY-4*p,88*p,34*p);} if(stage>=2){for(let i=0;i<3;i++){const sx=baseX+118*p+i*16*p;ctx.strokeStyle='rgba(255,220,145,.55)';ctx.beginPath();ctx.moveTo(sx,baseY+6*p);ctx.lineTo(sx+14*p,baseY-10*p);ctx.lineTo(sx+28*p,baseY+6*p);ctx.stroke();}} if(stage>=3){const yy=baseY-42*p;ctx.strokeStyle='rgba(255,170,100,.34)';ctx.beginPath();ctx.moveTo(baseX+170*p,yy);ctx.lineTo(baseX+220*p,yy-18*p);ctx.lineTo(baseX+250*p,yy);ctx.stroke();} if(stage>=4){ctx.fillStyle='rgba(130,185,220,.2)';ctx.fillRect(baseX+228*p,baseY-48*p,14*p,54*p);} if(stage>=5){for(let i=0;i<2;i++){const dx=baseX+236*p+Math.sin(ts*.002+i)*18*p,dy=baseY-72*p+Math.cos(ts*.0018+i)*8*p;ctx.fillStyle='rgba(255,220,160,.95)';ctx.fillRect(dx,dy,4*p,4*p);}}} if(sc==='nuclear'){if(stage>=1){ctx.strokeStyle='rgba(205,255,135,.45)';ctx.strokeRect(baseX-10*p,baseY-2*p,96*p,34*p);} if(stage>=2){ctx.fillStyle='rgba(178,205,135,.18)';ctx.fillRect(baseX+108*p,baseY-4*p,52*p,18*p);} if(stage>=3){const tx=baseX+180*p+Math.sin(ts*.0014)*22*p;ctx.fillStyle='rgba(26,36,28,.95)';ctx.fillRect(tx,baseY+12*p,24*p,9*p);} if(stage>=4){for(let i=0;i<2;i++){const px=baseX+232*p+i*22*p;ctx.strokeStyle='rgba(190,255,150,.55)';ctx.beginPath();ctx.moveTo(px,baseY+10*p);ctx.lineTo(px,baseY-54*p);ctx.stroke();}} if(stage>=5){ctx.strokeStyle='rgba(194,255,125,.18)';ctx.beginPath();ctx.arc(baseX+252*p,baseY-26*p,30*p+6*p*pulse,0,Math.PI*2);ctx.stroke();}} if(sc==='epidemic'){if(stage>=1){ctx.strokeStyle='rgba(145,255,220,.45)';ctx.strokeRect(baseX-8*p,baseY-2*p,80*p,34*p);} if(stage>=2){ctx.fillStyle='rgba(145,255,220,'+(.12+.12*pulse)+')';ctx.fillRect(baseX+98*p,baseY-24*p,36*p,24*p);} if(stage>=3){const ax=baseX+154*p+Math.sin(ts*.0022)*12*p;ctx.fillStyle='rgba(235,244,249,.92)';ctx.fillRect(ax,baseY+12*p,20*p,8*p);ctx.fillStyle='rgba(255,72,72,.8)';ctx.fillRect(ax+12*p,baseY+10*p,3*p,3*p);} if(stage>=4){ctx.strokeStyle='rgba(120,255,210,.45)';ctx.beginPath();ctx.moveTo(baseX+194*p,baseY+8*p);ctx.lineTo(baseX+194*p,baseY-46*p);ctx.stroke();ctx.beginPath();ctx.moveTo(baseX+194*p,baseY-46*p);ctx.lineTo(baseX+228*p,baseY-46*p);ctx.stroke();} if(stage>=5){for(let i=0;i<2;i++){const dx=baseX+214*p+Math.cos(ts*.0018+i)*20*p,dy=baseY-78*p+Math.sin(ts*.0023+i)*10*p;ctx.strokeStyle='rgba(145,255,220,.7)';ctx.beginPath();ctx.arc(dx,dy,5*p,0,Math.PI*2);ctx.stroke();}}} ctx.restore();};

__ctx.drawScenarioEffects = function drawScenarioEffects(ctx,w,h,sc,hz,ts,localAlpha=1){const p=hz/100;ctx.save();ctx.globalAlpha=localAlpha; if(sc==='ice'){ctx.strokeStyle=`rgba(235,250,255,${(.2+p*.28)})`;ctx.lineWidth=1.1+p*1.1;for(let i=0;i<18+Math.round(hz*.5);i++){const x=(i*61+ts*(.03+.08*p))%(w+90)-40;const y=(i*27+ts*(.05+.08*p))%(h+40)-20;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4-12*p,y+4+7*p);ctx.stroke();}} else if(sc==='heat'){ctx.strokeStyle=`rgba(255,205,130,${.10+p*.18})`;for(let i=0;i<8+Math.round(hz*.07);i++){const base=h*.18+i*14;ctx.beginPath();for(let x=0;x<=w;x+=18){const y=base+Math.sin(x*.03+ts*.003+i*.7)*(2+4*p);if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}} else if(sc==='nuclear'){ctx.fillStyle=`rgba(215,235,175,${.10+p*.18})`;for(let i=0;i<16+hz*.4;i++){const x=(i*61+ts*.012*(1+p))%w;const y=(i*43+ts*.018*(1+p))%h;const q=1+(i%3);ctx.fillRect(x,y,q,q);} } else if(sc==='epidemic'){ctx.strokeStyle=`rgba(155,255,216,${.10+p*.22})`;ctx.lineWidth=1;for(let i=0;i<12+Math.round(hz*.24);i++){const x=(i*79+ts*.012)%w,y=(i*47+ts*.009)%h,r=2+(i%3);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}} ctx.restore();};

__ctx.drawHills = function drawHills(ctx,w,h,c1,c2){ctx.fillStyle=c1;ctx.beginPath();ctx.moveTo(0,h*.82);for(let x=0;x<=w;x+=40){ctx.lineTo(x,h*.76+Math.sin(x*.012+__ctx.sceneEngine.t*.00025)*18)}ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(0,h*.88);for(let x=0;x<=w;x+=40){ctx.lineTo(x,h*.84+Math.sin(x*.016+1.7+__ctx.sceneEngine.t*.00018)*14)}ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();};

__ctx.drawCitySilhouette = function drawCitySilhouette(ctx,w,h,color){ctx.fillStyle=color; for(let i=0;i<14;i++){const bw=28+(i%4)*12; const bh=42+((i*37)%90); const bx=w*.45+i*34; ctx.fillRect(bx,h*.58-bh,bw,bh);} };

__ctx.animateSceneCanvas = function animateSceneCanvas(ts){
 const ctx=__ctx.sceneEngine.ctx; if(!ctx){requestAnimationFrame(__ctx.animateSceneCanvas);return;} const w=__ctx.sceneEngine.w,h=__ctx.sceneEngine.h; __ctx.sceneEngine.t=ts; ctx.clearRect(0,0,w,h);
 if(!__ctx.viewState.scenario){requestAnimationFrame(__ctx.animateSceneCanvas);return;}
 const sc=__ctx.viewState.scenario||'ice', hz=__ctx.clamp(__ctx.viewState.hazard||0,0,100), p=hz/100, stage=__ctx.viewState.settlementLevel||0;
 let sky1='#2d3e4e', sky2='#0e1620', glow='rgba(255,255,255,.15)', ground1='#1a232d', ground2='#0d141c';
 if(sc==='ice'){sky1='#6b8da7'; sky2='#16222f'; glow='rgba(200,245,255,.35)'; ground1='#ddeef7'; ground2='#8796a7';}
 if(sc==='heat'){sky1='#8a4b2f'; sky2='#2b1714'; glow='rgba(255,170,70,.40)'; ground1='#634136'; ground2='#2d1e18';}
 if(sc==='nuclear'){sky1='#4c5b42'; sky2='#111613'; glow='rgba(205,255,135,.22)'; ground1='#394238'; ground2='#171b17';}
 if(sc==='epidemic'){sky1='#31545c'; sky2='#0d151a'; glow='rgba(145,255,210,.22)'; ground1='#223338'; ground2='#11181c';}
 const grad=ctx.createLinearGradient(0,0,0,h); grad.addColorStop(0,sky1); grad.addColorStop(1,sky2); ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
 __ctx.drawScenarioImage(ctx,w,h,sc,.54+.08*(stage/5));
 ctx.fillStyle='rgba(0,0,0,'+(.18+p*.18)+')'; ctx.fillRect(0,0,w,h);
 ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(w*(sc==='heat'?0.82:0.76), h*.22, 46+55*p, 0, Math.PI*2); ctx.fill();
 __ctx.drawHills(ctx,w,h,ground1,ground2); __ctx.drawCitySilhouette(ctx,w,h,'rgba(10,14,19,.55)'); __ctx.drawSettlementArchitecture(ctx,w,h,stage,sc,ts,false); __ctx.drawScenarioStageSignature(ctx,w,h,stage,sc,ts,false); __ctx.drawScenarioEffects(ctx,w,h,sc,hz,ts,.95);
 if(sc==='nuclear'){for(let i=0;i<2+Math.round(p*3);i++){const bx=w*(.62+i*.08),by=h*.58;const rise=((ts*.018+i*62)%(100+hz*.7));const rr=14+rise*.18;ctx.fillStyle=`rgba(58,67,49,${.08+p*.13})`;ctx.beginPath();ctx.arc(bx+Math.sin(ts*.001+i)*8,by-rise,rr,0,Math.PI*2);ctx.fill();}}
 ctx.fillStyle='rgba(0,0,0,'+(0.10+p*.14)+')'; ctx.fillRect(0,0,w,h);
 requestAnimationFrame(__ctx.animateSceneCanvas);
};

__ctx.initStart = function initStart(){
 __ctx.resetGame(); __ctx.applyScenarioTheme();
 const modal=__ctx.browser.document.getElementById('startModal');
 modal.innerHTML=`<h1>ПРЕДЕЛ</h1><p class="muted">Главная цель — спасти как можно больше людей и потерять как можно меньше. Постройте убежище до того, как привычный мир станет непригоден для жизни, а затем превратите его в устойчивое поселение, способное принимать новых беженцев. Итоговая оценка прежде всего зависит от числа выживших, спасённых с поверхности и понесённых потерь.</p>
 <div class="scenarioGrid">${__ctx.entries(__ctx.scenarios).map(([k,s])=>`<div class="scenario" data-s="${k}"><div class="scenarioArt" style="background-image:url('${__ctx.scenarioVisuals[k].image}')"></div><div class="scenarioShade"></div><div class="scenarioCopy"><div class="big">${s.icon}</div><h3>${s.name}</h3><p>${s.desc}</p><p class="footerHint">Звук: ${__ctx.scenarioVisuals[k].audio}</p></div></div>`).join('')}</div>
 <div class="setup"><label>Планируемое население убежища<select id="popSelect"><option value="24">24 человека — малое, легко обеспечиваемое убежище</option><option value="40" selected>40 человек — сбалансированная колония</option><option value="64">64 человека — больше рабочих рук и потенциала</option><option value="96">96 человек — путь к подземному городу</option></select></label><label>Сложность<select id="diffSelect"><option value="0.9">Мягкая</option><option value="1" selected>Нормальная</option><option value="1.18">Жёсткая</option></select></label></div>
 <p class="footerHint"><span style="opacity:.8">Если кнопка запуска не помещается на экране, прокрутите это окно вниз. </span>Планируемая численность задаёт стартовый масштаб убежища, но не является пределом спасения: развитое поселение может принять намного больше людей. Численность определяет рабочую силу, количество действий и нагрузку на воду: население потребляет воду первым, а только остаток доступен производству еды. Разные сценарии требуют разных систем. После начала катастрофы доступ к городу резко сократится. Звук браузер разрешит только после нажатия кнопки старта.</p>
 <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="startBtn" disabled>Начать подготовку</button>${__ctx.hasSave()?`<button id="continueBtn">↩ Продолжить сохранённую игру</button><button id="deleteSaveBtn" class="danger">Удалить сохранение</button>`:''}</div>`;
 let selected=null;
 modal.querySelectorAll('.scenario').forEach(el=>el.onclick=()=>{
   modal.querySelectorAll('.scenario').forEach(x=>x.classList.remove('selected'));
   el.classList.add('selected'); selected=el.dataset.s; __ctx.browser.document.getElementById('startBtn').disabled=false;
   __ctx.commands.previewScenario(selected); __ctx.applyScenarioTheme(); __ctx.updateAudioUI();
 });
 __ctx.browser.document.getElementById('startBtn').onclick=()=>__ctx.commands.startGame(selected,Number(__ctx.browser.document.getElementById('popSelect').value),Number(__ctx.browser.document.getElementById('diffSelect').value));const cb=__ctx.browser.document.getElementById('continueBtn');if(cb)cb.onclick=()=>__ctx.commands.loadGame();const db=__ctx.browser.document.getElementById('deleteSaveBtn');if(db)db.onclick=()=>__ctx.commands.deleteSave();__ctx.updateSaveUI();
};

__ctx.createFinalReportCanvases = function createFinalReportCanvases(){
 const s=__ctx.scenarios[__ctx.viewState.scenario],v=__ctx.scenarioVisuals[__ctx.viewState.scenario],hm=__ctx.humanitarianMetrics(),hist=__ctx.viewState.history||[],loss=__ctx.viewState.lossCauses||{},accent=v?.accent||s?.color||'#d8ff72',pages=[];
 const c1=__ctx.browser.document.createElement('canvas');c1.width=1240;c1.height=1754;let ctx=c1.getContext('2d');ctx.fillStyle='#071018';ctx.fillRect(0,0,c1.width,c1.height);__ctx.reportCoverImage(ctx,__ctx.getScenarioImage(__ctx.viewState.scenario),0,0,1240,700);let g=ctx.createLinearGradient(0,0,0,760);g.addColorStop(0,'rgba(4,8,12,.18)');g.addColorStop(.55,'rgba(4,8,12,.44)');g.addColorStop(1,'#071018');ctx.fillStyle=g;ctx.fillRect(0,0,1240,780);
 ctx.fillStyle=accent;ctx.font='800 28px system-ui,sans-serif';ctx.fillText('ПРЕДЕЛ · ИТОГОВЫЙ ОТЧЁТ',72,84);ctx.fillStyle='#fff';ctx.font='900 66px system-ui,sans-serif';ctx.fillText(__ctx.viewState.finalWin?'МИССИЯ ВЫПОЛНЕНА':'КАМПАНИЯ ЗАВЕРШЕНА',72,176);ctx.font='700 34px system-ui,sans-serif';ctx.fillText(`${s.icon} ${s.name}`,72,232);ctx.fillStyle='#d4e0e8';ctx.font='400 25px system-ui,sans-serif';ctx.fillText(`${__ctx.viewState.city}${__ctx.viewState.site?' · '+__ctx.viewState.site.name:''} · ${__ctx.viewState.month} месяцев`,72,276);
 ctx.fillStyle='rgba(5,10,16,.72)';ctx.beginPath();ctx.roundRect(72,410,1096,210,28);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#9fb0be';ctx.font='600 24px system-ui,sans-serif';ctx.fillText('ГУМАНИТАРНЫЙ РЕЗУЛЬТАТ',104,458);ctx.fillStyle='#fff';ctx.font='900 92px system-ui,sans-serif';ctx.fillText(`${hm.grade}`,104,560);ctx.fillStyle=accent;ctx.font='800 44px system-ui,sans-serif';ctx.fillText(`${hm.index}/100`,230,548);ctx.fillStyle='#e8f0f5';ctx.font='500 25px system-ui,sans-serif';__ctx.reportWrap(ctx,'Главный критерий: сколько людей удалось сохранить в живых, сколько было спасено с поверхности и сколько жизней поселение потеряло.',430,492,680,34,4);
 __ctx.reportCard(ctx,72,720,340,190,'Живы в финале',Math.round(hm.survivors),'Люди, которых поселение сохранило к концу кампании.',accent);__ctx.reportCard(ctx,450,720,340,190,'Спасено',`+${Math.round(hm.rescued)}`,'Приняты с поверхности, из города и групп беженцев.',accent);__ctx.reportCard(ctx,828,720,340,190,'Потери',`−${Math.round(hm.deaths)}`,'Каждая потеря имеет самый высокий отрицательный вес.',hm.deaths>0?'#ff6d6d':accent);
 __ctx.reportCard(ctx,72,950,340,190,'Беженцы',`${Math.round(hm.accepted)}/${Math.round(hm.arrivals)}`,'Принято из всех групп, дошедших до периметра.',accent);__ctx.reportCard(ctx,450,950,340,190,'Устойчивость',`${Math.round(__ctx.resilience())}%`,__ctx.currentStage().name,accent);__ctx.reportCard(ctx,828,950,340,190,'Итоговый счёт',__ctx.viewState.score,`Гуманитарная часть: ${hm.humanitarian}`,accent);
 ctx.fillStyle='#eef5f8';ctx.font='800 31px system-ui,sans-serif';ctx.fillText('Почему результат именно такой',72,1210);ctx.fillStyle='#bac9d3';ctx.font='400 24px system-ui,sans-serif';const survival=Math.round(hm.survivalRate*100),accept=Math.round(hm.acceptanceRate*100);__ctx.reportWrap(ctx,`Под защитой поселения выжило ${survival}% людей, прошедших через его систему. Доля принятых беженцев — ${accept}%. Потери: ${Math.round(hm.deaths)}. В итоговом счёте человеческие жизни имеют существенно больший вес, чем технологические и инфраструктурные показатели.`,72,1258,1096,34,7);
 ctx.fillStyle=accent;ctx.fillRect(72,1510,1096,3);ctx.fillStyle='#92a6b4';ctx.font='500 20px system-ui,sans-serif';ctx.fillText(`ПРЕДЕЛ · ${new Date().toLocaleDateString('ru-RU')} · отчёт сформирован локально в браузере`,72,1560);pages.push(c1);
 const c2=__ctx.browser.document.createElement('canvas');c2.width=1240;c2.height=1754;ctx=c2.getContext('2d');ctx.fillStyle='#071018';ctx.fillRect(0,0,1240,1754);ctx.fillStyle=accent;ctx.font='800 28px system-ui,sans-serif';ctx.fillText('ПРЕДЕЛ · ХОД КАМПАНИИ',72,84);ctx.fillStyle='#fff';ctx.font='900 54px system-ui,sans-serif';ctx.fillText('ЛЮДИ, РИСК И УСТОЙЧИВОСТЬ',72,156);
 const x=92,y=260,w=1056,h=430;ctx.fillStyle='rgba(14,22,31,.9)';ctx.beginPath();ctx.roundRect(72,220,1096,520,26);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.12)';ctx.stroke();ctx.fillStyle='#9fb0be';ctx.font='600 22px system-ui,sans-serif';ctx.fillText('Динамика населения и интенсивности катастрофы',92,258);
 if(hist.length>1){const maxPop=Math.max(10,...hist.map(p=>p.population||0));ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;for(let i=0;i<=4;i++){const yy=y+h*i/4;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+w,yy);ctx.stroke()}ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.beginPath();hist.forEach((p,i)=>{const px=x+w*i/(hist.length-1),py=y+h-(p.population||0)/maxPop*h;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.stroke();ctx.strokeStyle='#ff846c';ctx.lineWidth=4;ctx.beginPath();hist.forEach((p,i)=>{const px=x+w*i/(hist.length-1),py=y+h-__ctx.clamp(p.hazard||0,0,100)/100*h;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.stroke();ctx.fillStyle=accent;ctx.font='600 20px system-ui,sans-serif';ctx.fillText('Население',x,y+h+32);ctx.fillStyle='#ff846c';ctx.fillText('Опасность',x+150,y+h+32)}
 ctx.fillStyle='#fff';ctx.font='800 31px system-ui,sans-serif';ctx.fillText('Потери по причинам',72,820);const causes=[['Экспедиции',loss.expedition||0],['Условия среды',loss.environment||0],['Риски беженцев',loss.refugees||0],['Прочее',loss.other||0]];causes.forEach((a,i)=>__ctx.reportCard(ctx,72+(i%2)*548,860+Math.floor(i/2)*190,510,150,a[0],Math.round(a[1]),'',a[1]>0?'#ff846c':accent));
 ctx.fillStyle='#fff';ctx.font='800 31px system-ui,sans-serif';ctx.fillText('Поселение в финале',72,1305);ctx.fillStyle='#bac9d3';ctx.font='400 23px system-ui,sans-serif';__ctx.reportWrap(ctx,`Форма: ${__ctx.currentStage().name}. Знания: ${Math.round(__ctx.viewState.bunker.knowledge||0)}. Здоровье: ${Math.round(__ctx.viewState.health)}%. Мораль: ${Math.round(__ctx.viewState.morale)}%. Дефицитных периодов: ${__ctx.viewState.shortages||0}. Инцидентов при приёме беженцев: ${__ctx.viewState.refugeeIncidents||0}.`,72,1352,1096,33,5);ctx.fillStyle='#bac9d3';ctx.font='400 23px system-ui,sans-serif';__ctx.reportWrap(ctx,`Сценарный риск притока людей: ${__ctx.refugeeRiskText()}. Чем устойчивее становилось поселение, тем заметнее оно было для выживших — и тем тяжелее становился выбор между гуманитарной миссией и безопасностью тех, кто уже находился внутри.`,72,1468,1096,33,6);ctx.fillStyle=accent;ctx.fillRect(72,1650,1096,3);pages.push(c2);return pages;
};

__ctx.animateMapScene = function animateMapScene(ts){
 const c=__ctx.mapSceneEngine.ctx;if(!c){requestAnimationFrame(__ctx.animateMapScene);return;}const w=__ctx.mapSceneEngine.w,h=__ctx.mapSceneEngine.h;__ctx.mapSceneEngine.t=ts;c.clearRect(0,0,w,h);
 if(!__ctx.viewState.scenario){requestAnimationFrame(__ctx.animateMapScene);return;}
 const hz=__ctx.clamp(__ctx.viewState.hazard||0,0,100),p=hz/100,sc=__ctx.viewState.scenario,s=__ctx.scenarios[sc],stage=__ctx.viewState.settlementLevel||0;
 __ctx.drawScenarioImage(c,w,h,sc,.96);
 c.fillStyle=`rgba(4,8,14,${.10+p*.18})`;c.fillRect(0,0,w,h);
 const vg=c.createRadialGradient(w*.52,h*.42,20,w*.52,h*.42,Math.max(w,h)*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,`rgba(0,0,0,${.12+p*.20})`);c.fillStyle=vg;c.fillRect(0,0,w,h);
 __ctx.drawSettlementArchitecture(c,w,h,stage,sc,ts,true); __ctx.drawScenarioStageSignature(c,w,h,stage,sc,ts,true); __ctx.drawScenarioEffects(c,w,h,sc,hz,ts,1);
 // extra localized drama for higher levels
 if(stage>=3){const glowAlpha=.06+.03*stage; c.fillStyle=`rgba(255,255,255,${glowAlpha*(.4+.6*(Math.sin(ts*.002)+1)/2)})`; c.fillRect(w*.12,h*.60,w*.34,h*.16);}
 // HUD at the top of the image.
 c.fillStyle='rgba(7,12,18,.58)';c.beginPath();c.roundRect(14,14,Math.min(w-28,470),46,12);c.fill();
 c.strokeStyle=s.color;c.lineWidth=1.6;c.stroke();c.fillStyle='#eef6fb';c.font='700 17px system-ui,sans-serif';c.fillText(`${s.icon} ${s.name} · интенсивность ${Math.round(hz)}%`,28,33);
 // Bunker/site marker in the lower-left.
 if(__ctx.viewState.site){c.fillStyle='rgba(7,12,18,.62)';c.beginPath();c.roundRect(16,h-56,Math.min(w-32,360),38,10);c.fill();c.fillStyle=s.color;c.font='600 14px system-ui,sans-serif';c.fillText(`Убежище: ${__ctx.viewState.site.name}`,28,h-32);}
 requestAnimationFrame(__ctx.animateMapScene);
};

__ctx.drawMap = function drawMap(){/* Центральная сцена анимируется непрерывно через animateMapScene(). */};

__ctx.artMix = function artMix(a,b,p){const aa=a.replace('#',''),bb=b.replace('#','');return '#'+[0,2,4].map(i=>Math.round(parseInt(aa.slice(i,i+2),16)*(1-p)+parseInt(bb.slice(i,i+2),16)*p).toString(16).padStart(2,'0')).join('');};

__ctx.artSeed = function artSeed(n){let x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};

__ctx.artHazard = function artHazard(){return Number.isFinite(__ctx.viewState.environment?.visualSeverity)?__ctx.viewState.environment.visualSeverity:Number.isFinite(__ctx.viewState.environment?.severity)?__ctx.viewState.environment.severity:(__ctx.viewState.hazard||0);};

__ctx.artEase = function artEase(a,b,n){return __ctx.clamp((n-a)/(b-a),0,1);};

__ctx.artPoly = function artPoly(c,points,color,stroke=null){c.beginPath();points.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};

__ctx.artLine = function artLine(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.stroke();};

__ctx.artCloud = function artCloud(c,x,y,s,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,s*2.4,s*.45,0,0,Math.PI*2);c.ellipse(x-s*.9,y-s*.20,s*1.1,s*.5,0,0,Math.PI*2);c.ellipse(x+s*.5,y-s*.34,s*1.3,s*.7,0,0,Math.PI*2);c.ellipse(x+s*1.7,y-s*.05,s*.8,s*.5,0,0,Math.PI*2);c.fill();};

__ctx.artTree = function artTree(c,x,y,s,p,sc){
 const dead=(sc==='heat'||sc==='nuclear')&&p>0.50+__ctx.artSeed(x)*.22,ice=sc==='ice'?__ctx.artEase(.18,.70,p):0;
 c.fillStyle=__ctx.artMix('#5e6656','#444647',p);c.fillRect(x-s*.075,y-s*.77,s*.15,s*.83);
 if(dead){__ctx.artLine(c,[[x,y-s*.45],[x-s*.32,y-s*.85],[x-s*.37,y-s*1.2]],'#4d4b41',s*.055);__ctx.artLine(c,[[x,y-s*.6],[x+s*.35,y-s*1.04]],'#4d4b41',s*.05);return;}
 const col=ice>0.5?__ctx.artMix('#789994','#dfedf0',ice):__ctx.artMix('#4e7c62',sc==='heat'?'#8e7751':sc==='nuclear'?'#4b5552':'#426f61',p);
 for(let i=0;i<3;i++){const yy=y-s*.38-i*s*.31,ww=s*(.52-i*.09);__ctx.artPoly(c,[[x-ww,yy],[x,yy-s*.69],[x+ww,yy]],col);if(ice>.15)__ctx.artPoly(c,[[x-ww*.65,yy-s*.17],[x,yy-s*.69],[x+ww*.50,yy-s*.17],[x+ww*.1,yy-s*.30],[x-ww*.16,yy-s*.18]],`rgba(228,242,244,${ice*.85})`);}
};

__ctx.artBuilding = function artBuilding(c,x,y,bw,bh,index,p,sc){
 const decay=__ctx.artEase(sc==='nuclear'?.35:.52,.95,p),broken=__ctx.artSeed(index+11)<decay*.72;
 const roof=broken?bh*(.50+__ctx.artSeed(index)*.32):bh;
 const front=__ctx.artMix(['#b7bcae','#b7b7a4','#a4b5b1','#bdc3b5','#c2baaa'][index%5],sc==='heat'?'#7f6c56':sc==='nuclear'?'#626b67':sc==='ice'?'#becbd2':'#84958a',p*.7);
 const side=__ctx.artMix(front,'#263d40',.28);
 if(broken){__ctx.artPoly(c,[[x,y],[x,y-roof],[x+bw*.2,y-roof-8],[x+bw*.37,y-roof+5],[x+bw*.59,y-roof-5],[x+bw,y-roof+2],[x+bw,y]],front);}
 else c.fillStyle=front,c.fillRect(x,y-bh,bw,bh);
 __ctx.artPoly(c,[[x+bw,y],[x+bw+bw*.18,y-6],[x+bw+bw*.18,y-roof-6],[x+bw,y-roof]],side);
 if(!broken)__ctx.artPoly(c,[[x,y-bh],[x+bw*.18,y-bh-6],[x+bw*1.18,y-bh-6],[x+bw,y-bh]],sc==='ice'&&p>.2?'#dce9eb':__ctx.artMix('#81918c','#525a56',p));
 const floors=Math.max(1,Math.floor(roof/12)),cols=Math.max(1,Math.floor(bw/10));
 for(let row=0;row<floors;row++)for(let col=0;col<cols;col++){
  const on=__ctx.artSeed(index*43+row*7+col)>p*.83+.12;
  c.fillStyle=on?'#e8d2a2':__ctx.artMix('#5b797b','#354847',p);c.globalAlpha=on?.65:.6;c.fillRect(x+4+col*9,y-9-row*12,4.4,6.2);
 }c.globalAlpha=1;
 if(p>.35&&__ctx.artSeed(index+170)>.70){__ctx.artLine(c,[[x+bw*.45,y-roof+4],[x+bw*.39,y-roof*.6],[x+bw*.57,y-roof*.56],[x+bw*.5,y-7]],'rgba(39,52,49,.42)',1.2);}
 if(sc==='ice'&&p>.20){c.fillStyle=`rgba(226,239,243,${__ctx.artEase(.2,.7,p)*.9})`;c.fillRect(x-2,y+1,bw+7,2+p*5);}
 if(sc==='epidemic'&&p>.3&&index%7===0){c.fillStyle='#e1d8a6';c.fillRect(x+3,y-12,bw-6,3);c.fillStyle='#b6534c';c.fillRect(x+bw*.40,y-20,3,9);c.fillRect(x+bw*.33,y-17,8,3);}
};

__ctx.artWorldBase = function artWorldBase(c,sc,p){
 const W=1440,H=560,late=__ctx.artEase(.15,1,p),cold=sc==='ice',hot=sc==='heat',nuke=sc==='nuclear',bio=sc==='epidemic';
 const skyTop=__ctx.artMix('#85b2bf',cold?'#526d85':hot?'#8f513b':nuke?'#323f40':'#577274',late),skyBottom=__ctx.artMix('#e5d9b4',cold?'#abbeca':hot?'#d8a16d':nuke?'#8b927b':'#bcc6b7',late);
 const sky=c.createLinearGradient(0,0,0,370);sky.addColorStop(0,skyTop);sky.addColorStop(1,skyBottom);c.fillStyle=sky;c.fillRect(0,0,W,H);
 // Pale midday disk and soft atmospheric falloff.
 const sunX=1090,sunY=103,halo=c.createRadialGradient(sunX,sunY,3,sunX,sunY,220);halo.addColorStop(0,`rgba(255,237,181,${.72*(1-p*.7)})`);halo.addColorStop(1,'rgba(255,237,181,0)');c.fillStyle=halo;c.fillRect(700,0,640,340);
 c.fillStyle=__ctx.artMix('#fff1c6',hot?'#ffc06d':'#d2d8bc',p);c.globalAlpha=1-p*.72;c.beginPath();c.arc(sunX,sunY,hot?29+p*17:24,0,Math.PI*2);c.fill();c.globalAlpha=1;
 // Four ridgelines produce a wide valley, with genuine atmospheric perspective.
 for(let j=0;j<4;j++){
  const base=240+j*24,amp=50-j*8;c.beginPath();c.moveTo(0,base+30);
  for(let x=0;x<=W;x+=12)c.lineTo(x,base-Math.sin(x*.004+j*.9)*amp-Math.sin(x*.011+j)*amp*.4);
  c.lineTo(W,H);c.lineTo(0,H);c.closePath();c.fillStyle=__ctx.artMix(['#96afb1','#91a9a4','#819d8a','#789378'][j],cold?['#98acbc','#a0b2c1','#a3b6bd','#b1c0c4'][j]:hot?['#a48e79','#ac8b64','#a5885d','#ad8a5d'][j]:nuke?['#758481','#667673','#5c6e63','#566558'][j]:['#829d99','#78978b','#69867b','#657f6c'][j],late);c.fill();
 }
 const soil=__ctx.artMix('#7e9572',cold?'#c5d7de':hot?'#aa8a5b':nuke?'#515e51':'#687e65',late);
 __ctx.artPoly(c,[[0,351],[290,320],[550,353],[811,330],[1115,348],[1440,319],[1440,H],[0,H]],soil);
 // Field strips, orchard plots, slopes and narrow tracks.
 const colors=['#a1a67a','#8d9d72','#8b9671','#b4b187','#81956f'];
 for(let i=0;i<16;i++){
  const x=i*112-90,y=356+__ctx.artSeed(i)*28;
  __ctx.artPoly(c,[[x,y],[x+85,y-14],[x+195,451],[x+71,469]],__ctx.artMix(colors[i%5],cold?'#d1e0e3':hot?'#b49a6b':nuke?'#62705b':'#839578',late));
  if(i%2===0)for(let k=0;k<5;k++)__ctx.artLine(c,[[x+8+k*13,y+5],[x+83+k*18,455]],`rgba(47,66,44,${.10*(1-p*.5)})`,1);
 }
 // Winding river becomes a broad ice scar or dried-out river bed.
 const river=hot?__ctx.artMix('#82afb0','#bda67a',__ctx.artEase(.22,.9,p)):cold?__ctx.artMix('#8cb9bf','#d9e8e9',__ctx.artEase(.2,.8,p)):__ctx.artMix('#88b3af',nuke?'#798f78':'#7daba0',late);
 c.fillStyle=river;c.beginPath();c.moveTo(1450,317);c.bezierCurveTo(1190,320,1138,375,1005,393);c.bezierCurveTo(882,406,927,461,674,502);c.bezierCurveTo(600,516,578,540,570,560);c.lineTo(780,560);c.bezierCurveTo(822,516,1080,492,1082,436);c.bezierCurveTo(1083,393,1257,373,1450,365);c.closePath();c.fill();
 c.strokeStyle=__ctx.artMix('#d2dbb3','#b7c5b4',late);c.lineWidth=5;c.beginPath();c.moveTo(1440,366);c.bezierCurveTo(1250,371,1080,394,1082,436);c.bezierCurveTo(1080,492,822,516,780,560);c.stroke();
 // Forest on the far bank.
 for(let i=0;i<78;i++){const x=800+i*9+__ctx.artSeed(i+20)*10,y=329+Math.sin(i*.16)*13+__ctx.artSeed(i+30)*9;__ctx.artTree(c,x,y,11+__ctx.artSeed(i+60)*21,p,sc);}
 // The city retains the same footprint through every phase.
 for(let row=0;row<3;row++){
  const count=18;for(let i=0;i<count;i++){
   const ix=i+row*count,x=420+i*37+row*22,y=310+row*23+Math.sin(i*.25)*5;
   const bw=20+__ctx.artSeed(ix+90)*14,bh=22+__ctx.artSeed(ix+99)*56+(row===0&&i>9&&i<15?35:0);
   __ctx.artBuilding(c,x,y,bw,bh,ix,p,sc);
  }
 }
 // Main road and bridge, with lamp poles and overhead infrastructure.
 c.lineJoin='round';__ctx.artLine(c,[[-30,494],[305,413],[648,386],[951,399],[1184,443],[1460,454]],__ctx.artMix('#66726c','#797e70',late),21);
 __ctx.artLine(c,[[-30,494],[305,413],[648,386],[951,399],[1184,443],[1460,454]],`rgba(222,218,180,${.47*(1-p*.8)})`,1.2);
 c.fillStyle=__ctx.artMix('#929c8c','#7b847e',p);c.fillRect(957,389,119,12);__ctx.artLine(c,[[957,385],[1078,385]],'#a9b0a0',2);for(let i=0;i<8;i++)__ctx.artLine(c,[[959+i*16,385],[959+i*16,398]],'#a1a997',1.2);
 for(let i=0;i<9;i++){
  const x=298+i*83,y=i<5?413-i*5:390+(i-4)*15;
  __ctx.artLine(c,[[x,y],[x,y-42],[x+12,y-46]],__ctx.artMix('#6b7b75','#4d5b55',p),1.4);
  if(p<.5||i%3===0){c.fillStyle=`rgba(255,225,142,${.18+p*.4})`;c.beginPath();c.ellipse(x+13,y-43,5,2,0,0,6.283);c.fill();}
 }
 // Foreground embankment, footpath, bushes and tiny stones.
 __ctx.artPoly(c,[[0,489],[180,449],[384,469],[546,506],[604,560],[0,560]],__ctx.artMix('#486c56',cold?'#91a8b5':hot?'#766143':nuke?'#34473e':'#365b4c',late));
 __ctx.artPoly(c,[[0,535],[181,470],[317,485],[515,550],[550,560],[491,560],[307,503],[179,492],[0,556]],__ctx.artMix('#b8b393',cold?'#e0e9e8':'#99917b',late));
 for(let i=0;i<25;i++)__ctx.artTree(c,i*66-20,486+Math.sin(i*.7)*19,21+__ctx.artSeed(i+190)*34,p,sc);
 // Scenic outlying houses, water tower and radio mast.
 __ctx.artBuilding(c,136,435,48,31,97,p,sc);__ctx.artBuilding(c,198,429,32,39,98,p,sc);
 __ctx.artPoly(c,[[132,404],[160,387],[187,404]],__ctx.artMix('#897d63',cold?'#d0dcdf':'#6b685b',p));
 __ctx.artLine(c,[[335,388],[342,318],[352,318],[361,388]],'#64766f',3);c.fillStyle=__ctx.artMix('#a5b2a2','#65776d',p);c.beginPath();c.ellipse(347,316,19,7,0,0,6.283);c.fill();c.fillRect(328,305,38,12);c.beginPath();c.ellipse(347,304,19,7,0,0,6.283);c.fill();
 __ctx.artLine(c,[[1221,354],[1239,233],[1257,354],[1221,354],[1251,317],[1229,291],[1246,270]],'#60726e',1.5);__ctx.artLine(c,[[1228,266],[1249,266]],'#60726e',2);
 if(bio&&p>.25){
  c.fillStyle='#cfcc9c';c.fillRect(636,369,51,6);for(let i=0;i<9;i++)__ctx.artPoly(c,[[639+i*6,369],[642+i*6,369],[638+i*6,375],[635+i*6,375]],'#494f42');
  for(let i=0;i<3;i++){c.fillStyle=__ctx.artMix('#e7e6cf','#a2b4a3',p);__ctx.artPoly(c,[[710+i*36,370],[722+i*36,350],[735+i*36,370]],c.fillStyle);}
 }
 // Cracks, fallen infrastructure and debris are permanent phase-dependent changes.
 if(p>.52){
  for(let i=0;i<24;i++){
   const x=340+__ctx.artSeed(i+410)*975,y=355+__ctx.artSeed(i+420)*125;
   if(i%3===0)__ctx.artLine(c,[[x,y],[x+9,y-2],[x+13,y+5],[x+23,y+3]],`rgba(48,52,41,${__ctx.artEase(.5,.9,p)*.55})`,1.3);
   else __ctx.artPoly(c,[[x,y],[x+__ctx.artSeed(i+80)*8,y-4],[x+10,y+1]],__ctx.artMix('#85917c','#5c6555',p));
  }
 }
 if(cold&&p>.35){
  c.fillStyle=`rgba(228,241,246,${__ctx.artEase(.35,.95,p)*.50})`;c.beginPath();c.moveTo(0,534);c.bezierCurveTo(242,480,370,555,621,548);c.lineTo(650,H);c.lineTo(0,H);c.closePath();c.fill();
  for(let i=0;i<15;i++)__ctx.artLine(c,[[827+i*32,459-i*1.8],[840+i*32,450-i*1.8],[846+i*32,452-i*1.8]],`rgba(132,168,184,${p*.6})`,1.3);
  if(p>.67){
   const bury=__ctx.artEase(.67,1,p);c.fillStyle=`rgba(208,225,235,${bury*.92})`;c.beginPath();c.moveTo(404,371);
   for(let xx=404;xx<1160;xx+=18)c.lineTo(xx,355-bury*19+Math.sin(xx*.027)*7+Math.sin(xx*.06)*3);
   c.lineTo(1160,380);c.lineTo(404,381);c.closePath();c.fill();
   for(let j=0;j<3;j++){c.fillStyle=`rgba(218,233,240,${bury*.16})`;c.beginPath();c.ellipse(390+j*280,373+j*40,280,10+j*4,-.04,0,Math.PI*2);c.fill();}
  }
 }
};

__ctx.drawLivingWorld = function drawLivingWorld(c,w,h,sc='ice',hazard=0,ts=0,compact=false){
 const p=__ctx.clamp(hazard/100,0,1),t=__ctx.livingArt.reduced?16000:ts;
 const env=__ctx.viewState.environment||{},weather=env.weather||{},wind=__ctx.clamp((Number(env.wind)||0)/100,0,1),storm=__ctx.clamp(Number(weather.intensity)||0,0,1);
 const key=`${sc}:${Math.round(p*100)}`;
 let layer=__ctx.livingArt.cache.get(key);
 if(!layer){layer=__ctx.browser.document.createElement('canvas');layer.width=1440;layer.height=560;__ctx.artWorldBase(layer.getContext('2d'),sc,p);if(__ctx.livingArt.cache.size>7)__ctx.livingArt.cache.delete(__ctx.livingArt.cache.keys().next().value);__ctx.livingArt.cache.set(key,layer);}
 c.save();c.scale(w/1440,h/560);c.drawImage(layer,0,0);
 // Slowly drifting cloud banks and atmospheric veils.
 for(let i=0;i<6;i++){
  const x=((i*287+t*(.002+i*.0005))%1850)-180,y=66+(i%3)*43;
  __ctx.artCloud(c,x,y,28+(i%3)*10,sc==='nuclear'&&p>.35?`rgba(43,53,51,${.12+p*.22})`:`rgba(245,242,219,${.22*(1-p*.55)})`);
 }
 // Warm sunbeams in preparation, disappearing under the final sky.
 if(p<.44){c.globalAlpha=(.44-p)*.15;__ctx.artPoly(c,[[1040,45],[1135,45],[804,560],[524,560]],'#fff7d8');__ctx.artPoly(c,[[1130,40],[1170,45],[1035,560],[872,560]],'#fff7d8');c.globalAlpha=1;}
 // A few birds and daily traffic make the opening feel alive.
 if(p<.43){
  c.strokeStyle='#556f6c';c.lineWidth=1.2;
  for(let i=0;i<6;i++){const x=(t*.013+i*91)%1520-40,y=116+Math.sin(t*.0005+i)*15+i*4,flap=Math.sin(t*.006+i)*3;c.beginPath();c.moveTo(x-5,y-flap);c.quadraticCurveTo(x-2,y-4,x,y);c.quadraticCurveTo(x+2,y-4,x+5,y-flap);c.stroke();}
  for(let i=0;i<3;i++){const f=((t*.000018+i*.29)%1),x=298+f*650,y=x<648?413-(x-298)/12.96:386+(x-648)/33.7;c.fillStyle=['#d9d0a6','#658d92','#a07b66'][i];c.fillRect(x,y-6,11,5);c.fillStyle='#314e52';c.fillRect(x+2,y-8,6,3);c.fillStyle='#3c4843';c.fillRect(x+1,y-2,2,2);c.fillRect(x+8,y-2,2,2);}
 }
 // Moving river glints fade when frozen or dried out.
 const waterAlive=sc==='ice'||sc==='heat'?1-__ctx.artEase(.2,.75,p):1;
 c.strokeStyle=`rgba(225,239,221,${.30*waterAlive})`;c.lineWidth=1;
 for(let i=0;i<15;i++){const x=870+__ctx.artSeed(i+800)*420,y=410+__ctx.artSeed(i+710)*48;__ctx.artLine(c,[[x+Math.sin(t*.0006+i)*6,y],[x+17+Math.sin(t*.0006+i)*6,y]],c.strokeStyle,1);}
 // Smoke and fire physically take over the city as the world collapses.
 if((sc==='heat'||sc==='nuclear')&&p>.32){
  const fire=__ctx.artEase(.32,.8,p);
  for(let i=0;i<5;i++){
   const x=570+i*117,y=299+(i%3)*13;
   for(let k=0;k<7;k++){const q=((t*.00013+k/7+i*.13)%1),xx=x+Math.sin(q*4+i)*q*22,yy=y-q*(75+90*p),r=7+q*31;c.fillStyle=`rgba(45,46,40,${(1-q)*fire*.24})`;c.beginPath();c.ellipse(xx,yy,r,r*.7,0,0,6.283);c.fill();}
   if(i%2===0&&p>.45){const fl=(Math.sin(t*.008+i)+Math.sin(t*.013+i)*.5)*4;__ctx.artPoly(c,[[x-7,y],[x-2,y-10-fl],[x+3,y-4],[x+5,y-22-fl],[x+11,y],[x+2,y+2]],`rgba(238,141,66,${fire*.9})`);__ctx.artPoly(c,[[x-3,y],[x+4,y-12-fl*.5],[x+8,y]],`rgba(255,213,111,${fire})`);}
  }
 }
 if(sc==='epidemic'&&p>.3){
  // Searchlights and decontamination steam; no floating cartoon viruses.
  const pulse=(Math.sin(t*.002)+1)/2;c.fillStyle=`rgba(237,200,127,${.04*p})`;__ctx.artPoly(c,[[708,361],[542,227],[617,208]],c.fillStyle);
  for(let i=0;i<5;i++){const q=(t*.00012+i/5)%1;c.fillStyle=`rgba(218,230,215,${(1-q)*.18*p})`;c.beginPath();c.ellipse(740+q*22,374-q*46,4+q*17,3+q*15,0,0,6.283);c.fill();}
  c.fillStyle=`rgba(255,106,80,${.3+pulse*.6})`;c.beginPath();c.arc(685,365,2.5,0,6.283);c.fill();
 }
 // Wind-driven precipitation / smoke particles. Deterministic, never random per frame.
 if(sc==='ice'&&p>.14){
  const density=Math.round(20+190*p+storm*35),snowWind=14+p*45+wind*22;
  c.strokeStyle=`rgba(240,248,255,${.10+p*.40})`;
  for(let i=0;i<density;i++){const speed=.035+__ctx.artSeed(i+33)*.04+p*.06,x=((__ctx.artSeed(i+31)*1700-t*speed*(.3+p))%1700+1700)%1700-120,y=(__ctx.artSeed(i+41)*670+t*speed)%670-50;__ctx.artLine(c,[[x,y],[x-snowWind*(.06+__ctx.artSeed(i+67)*.10),y+2+p*3]],c.strokeStyle,.6+__ctx.artSeed(i+55)*1.6);}
  if(p>.65){
   const blizzard=__ctx.artEase(.65,1,p);c.fillStyle=`rgba(224,236,243,${blizzard*.15})`;c.fillRect(0,0,1440,560);
   for(let i=0;i<9;i++){
    const phase=(t*.000015+i*.117)%1,x=1610-phase*1900,y=285+__ctx.artSeed(i+900)*245;
    const mist=c.createRadialGradient(x,y,0,x,y,210);mist.addColorStop(0,`rgba(218,233,240,${blizzard*.18})`);mist.addColorStop(1,'rgba(218,233,240,0)');c.fillStyle=mist;c.save();c.translate(x,y);c.scale(2.8,.15+__ctx.artSeed(i)*.16);c.translate(-x,-y);c.fillRect(x-220,y-220,440,440);c.restore();
   }
  }
 }else if(sc==='heat'&&p>.25){
  for(let i=0;i<65;i++){const x=((__ctx.artSeed(i+22)*1600-t*(.03+p*.04))%1600+1600)%1600-80,y=__ctx.artSeed(i+70)*560+Math.sin(t*.001+i)*6;c.fillStyle=`rgba(240,203,141,${.10+p*.15})`;c.fillRect(x,y,1.5+__ctx.artSeed(i)*2,1);}
  c.fillStyle=`rgba(223,172,99,${__ctx.artEase(.4,1,p)*.11})`;c.fillRect(0,210,1440,350);
 }else if(sc==='nuclear'&&p>.25){
  for(let i=0;i<100;i++){const x=(__ctx.artSeed(i+50)*1550+t*.014)%1550-55,y=(__ctx.artSeed(i+80)*620+t*.025)%620-30;c.fillStyle=`rgba(203,210,179,${.10+p*.20})`;c.fillRect(x,y,1.1+__ctx.artSeed(i)*1.5,1.1+__ctx.artSeed(i)*1.5);}
  const veil=c.createLinearGradient(0,0,0,560);veil.addColorStop(0,`rgba(12,23,25,${__ctx.artEase(.3,1,p)*.22})`);veil.addColorStop(1,'rgba(12,23,25,0)');c.fillStyle=veil;c.fillRect(0,0,1440,560);
 }
 // Short-lived fronts visibly change the same landscape between strategic phases.
 const weatherId=String(weather.id||weather.name||'').toLowerCase();
 if(storm>.3&&/storm|шторм|бур|фронт|осад|rain|дожд/.test(weatherId)){
  c.fillStyle=`rgba(28,42,48,${storm*.13})`;c.fillRect(0,0,1440,560);
  if(sc!=='ice'&&sc!=='heat'){
   c.strokeStyle=`rgba(194,218,214,${storm*.24})`;
   for(let i=0;i<80;i++){const x=(__ctx.artSeed(i+801)*1580+t*.1)%1580-70,y=(__ctx.artSeed(i+802)*650+t*.19)%650-40;__ctx.artLine(c,[[x,y],[x-3-wind*8,y+8]],c.strokeStyle,.8);}
  }
 }
 // Thin instrumentation framing, as if looking through a command-centre camera.
 const vg=c.createLinearGradient(0,0,0,560);vg.addColorStop(0,'rgba(5,16,20,.08)');vg.addColorStop(.6,'rgba(5,16,20,0)');vg.addColorStop(1,'rgba(5,16,20,.35)');c.fillStyle=vg;c.fillRect(0,0,1440,560);
 c.restore();
};

__ctx.artSettlement = function artSettlement(c,w,h,ts){
 if(!__ctx.viewState.site)return;
 const t=__ctx.livingArt.reduced?16000:ts,p=__ctx.clamp(__ctx.artHazard()/100,0,1),built=__ctx.viewState.built||{};
 c.save();c.scale(w/1440,h/560);const x=110,y=471;
 // Recessed concrete bunker, cut into the near valley bank.
 c.fillStyle='#263e40';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+7,y-52,x+140,y-69,x+170,y-15);c.lineTo(x+177,y+12);c.lineTo(x,y+18);c.closePath();c.fill();
 const shell=c.createLinearGradient(x,y-64,x,y+17);shell.addColorStop(0,'#a0b4ac');shell.addColorStop(.5,'#718d87');shell.addColorStop(1,'#4d6e68');c.fillStyle=shell;c.beginPath();c.moveTo(x-3,y-8);c.bezierCurveTo(x+3,y-62,x+150,y-75,x+178,y-8);c.lineTo(x+165,y-9);c.bezierCurveTo(x+145,y-54,x+13,y-42,x+10,y-8);c.closePath();c.fill();
 c.fillStyle='#223b3c';c.fillRect(x+41,y-24,77,38);c.fillStyle='#476761';c.fillRect(x+47,y-20,29,34);c.fillRect(x+81,y-20,29,34);__ctx.artLine(c,[[x+78,y-20],[x+78,y+14]],'#96b5a7',2);
 c.fillStyle='#edcf91';c.fillRect(x+54,y-16,15,6);c.fillRect(x+87,y-16,15,6);
 c.fillStyle='rgba(183,225,183,.35)';c.beginPath();c.ellipse(x+80,y+20,63,8,0,0,6.283);c.fill();
 __ctx.artLine(c,[[x+12,y-10],[x+12,y-44],[x+35,y-44]],'#a4b7a8',2);c.fillStyle='#ffe4a2';c.fillRect(x+30,y-45,12,3);
 if(built.power){
  for(let i=0;i<Math.min(5,built.power+1);i++){
   const sx=315+i*30,sy=462-i*2;__ctx.artPoly(c,[[sx,sy],[sx+9,sy-17],[sx+35,sy-17],[sx+27,sy]],'#385969','#7d9e9e');__ctx.artLine(c,[[sx+12,sy-15],[sx+5,sy-2]],'#6a8a90',.7);__ctx.artLine(c,[[sx+25,sy-15],[sx+19,sy-2]],'#6a8a90',.7);__ctx.artLine(c,[[sx+4,sy-8],[sx+28,sy-8]],'#6a8a90',.7);__ctx.artLine(c,[[sx+9,sy],[sx+9,sy+6]],'#728c7d',1.5);
  }
 }
 if(built.farm){
  for(let j=0;j<Math.min(3,built.farm);j++){
   const gx=285+j*91,gy=510;c.fillStyle='rgba(120,183,155,.72)';c.beginPath();c.ellipse(gx,gy,46,29,0,Math.PI,0);c.lineTo(gx+46,gy);c.closePath();c.fill();c.strokeStyle='#bdd6b9';c.lineWidth=1.3;c.stroke();
   for(let i=-2;i<=2;i++){c.beginPath();c.ellipse(gx+i*10,gy,11,28,0,Math.PI,0);c.stroke();}__ctx.artLine(c,[[gx-40,gy-12],[gx+40,gy-12]],'#a5c8ab',1);c.fillStyle='#83b67c';for(let i=0;i<8;i++)c.fillRect(gx-31+i*9,gy-4,4,4);
  }
 }
 if(built.habitat){for(let i=0;i<Math.min(4,built.habitat);i++){const bx=450+i*53,by=478+i*4;__ctx.artBuilding(c,bx,by,43,24,180+i,0,'ice');c.fillStyle='#a4c7b4';c.fillRect(bx-2,by-27,49,3);}}
 if(built.radioCenter){const rx=239,ry=428;__ctx.artLine(c,[[rx-14,ry+33],[rx,ry-58],[rx+14,ry+33],[rx-14,ry+33],[rx+10,ry+4],[rx-6,ry-15],[rx+4,ry-33]],'#b2c0a7',1.5);__ctx.artLine(c,[[rx-15,ry-33],[rx+15,ry-33]],'#b2c0a7',2);c.fillStyle=`rgba(255,136,101,${.45+.4*Math.sin(t*.003)})`;c.beginPath();c.arc(rx,ry-58,2.6,0,6.283);c.fill();}
 if(built.printer||built.printer3d){const px=591,py=510;__ctx.artBuilding(c,px,py,58,36,198,0,'ice');c.fillStyle='#d1dfbb';c.fillRect(px+20,py-19,20,11);c.strokeStyle='#e9e8bf';c.strokeRect(px+22,py-29,16,16);c.fillStyle='#80bfad';c.fillRect(px+22+(Math.sin(t*.002)+1)*6,py-29,5,3);}
 // The settlement remains a small, warm point of human activity against the cold world.
 const glow=c.createRadialGradient(x+80,y,10,x+80,y,145);glow.addColorStop(0,`rgba(249,205,135,${.03+p*.04})`);glow.addColorStop(1,'rgba(249,205,135,0)');c.fillStyle=glow;c.fillRect(x-100,y-150,360,270);
 c.restore();
};
}
export const steps: Initialization[] = [
{ order:6, run(__ctx:Runtime){__ctx.scenarioImageCache = {};
} },
{ order:9, run(__ctx:Runtime){__ctx.cinematicEngine = {canvas:null,ctx:null,w:0,h:0,dpr:1,active:false,title:'',text:'',sub:'',kicker:'',type:'phase',until:0,t:0};
} },
{ order:57, run(__ctx:Runtime){__ctx.fxEngine = {canvas:null,ctx:null,particles:[],last:0,w:0,h:0,dpr:1,scenario:null,hazard:0};
} },
{ order:63, run(__ctx:Runtime){__ctx.sceneEngine = {canvas:null,ctx:null,last:0,w:0,h:0,t:0};
} },
{ order:190, run(__ctx:Runtime){__ctx.mapSceneEngine = {canvas:null,ctx:null,w:0,h:0,dpr:1,last:0,t:0};
} },
{ order:299, run(__ctx:Runtime){__ctx.initStart=function(){
 __ctx.resetGame();__ctx.applyScenarioTheme();__ctx.browser.window.PredelAudio?.reset();__ctx.browser.document.getElementById('environmentBar').innerHTML='';
 const modal=__ctx.browser.document.getElementById('startModal'),threats: any={ice:'ХОЛОД / ГОЛОД / МЕТЕЛЬ',heat:'ЖАРА / ЗАСУХА / ПОЖАРЫ',nuclear:'ОСАДКИ / РАДИАЦИЯ / ИЗОЛЯЦИЯ',epidemic:'ЗАРАЖЕНИЕ / КАРАНТИН / ДОВЕРИЕ'};
 modal.innerHTML=`<div class="startMasthead"><div><span class="eyebrow">СТРАТЕГИЯ УСТОЙЧИВОГО ВЫЖИВАНИЯ</span><h1>ПРЕДЕЛ</h1></div><span class="startTag">V16 / ЖИВОЙ МИР</span></div><p class="startLead">Мир изменится. Вопрос — сколько людей вы сможете сохранить.</p><p class="startAbout">Постройте убежище, наладьте автономное производство и откройте пути к тем, кто ещё снаружи. Чем сильнее поселение, тем больше людей придёт к его воротам. Спасение и потери определят итог кампании.</p><div class="scenarioGrid">${__ctx.entries(__ctx.scenarios).map(([k,s],i)=>`<button type="button" class="scenario" data-s="${k}" aria-pressed="false"><canvas data-scenario="${k}" width="480" height="460" aria-hidden="true"></canvas><div class="scenarioShade"></div><div class="scenarioCopy"><span class="modeNo">СЦЕНАРИЙ / 0${i+1}</span><h3>${s.name}</h3><p>${s.desc}</p><div class="modeThreat">${threats[k]}</div></div></button>`).join('')}</div><div class="setup"><label>Масштаб стартового проекта<select id="popSelect"><option value="24">24 человека — малое убежище</option><option value="40" selected>40 человек — сбалансированная колония</option><option value="64">64 человека — большая община</option><option value="96">96 человек — подземный город</option></select></label><label>Сложность<select id="diffSelect"><option value="0.9">Мягкая</option><option value="1" selected>Нормальная</option><option value="1.18">Жёсткая</option></select></label></div><p class="startInstructions">Это план старта, а не предел спасения. У вас 18 месяцев до перелома и 84 месяца кампании. Карта, погода, запчасти и защита разведгрупп — части одной системы.</p><div class="startFooter"><span>01 ВЫБЕРИТЕ СЦЕНАРИЙ<br>02 ПРОЙДИТЕ БРИФИНГ · 03 СПАСАЙТЕ ЛЮДЕЙ</span><div class="startButtons">${__ctx.hasSave()?'<button id="continueBtn">Продолжить сохранённую игру</button>':''}<button class="primary" id="startBtn" disabled>Выберите сценарий →</button></div></div>`;
 let selected=null;modal.querySelectorAll('.scenario').forEach(el=>{el.onclick=()=>{selected=el.dataset.s;__ctx.commands.previewScenario(selected);modal.querySelectorAll('.scenario').forEach(x=>{x.classList.toggle('selected',x===el);x.setAttribute('aria-pressed',String(x===el));});const button=__ctx.browser.document.getElementById('startBtn');button.disabled=false;button.textContent='Получить брифинг →';__ctx.applyScenarioTheme();__ctx.renderEnvironmentTelemetry();};});
 __ctx.browser.document.getElementById('startBtn').onclick=()=>__ctx.commands.startGame(selected,Number(__ctx.browser.document.getElementById('popSelect').value),Number(__ctx.browser.document.getElementById('diffSelect').value));const cb=__ctx.browser.document.getElementById('continueBtn');if(cb)cb.onclick=()=>__ctx.commands.loadGame();
 for(const canvas of modal.querySelectorAll('canvas[data-scenario]')){if(typeof __ctx.drawLivingWorld==='function')__ctx.drawLivingWorld(canvas.getContext('2d'),480,460,canvas.dataset.scenario,canvas.dataset.scenario==='nuclear'?40:canvas.dataset.scenario==='epidemic'?34:24,9000,true);}
 __ctx.updateSaveUI();
};
} },
{ order:320, run(__ctx:Runtime){__ctx.livingArt = {
  reduced: __ctx.browser.window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  lastHero: -1, lastMap: -1, lastCinema: -1,
  cache: new Map(), lastBackdrop: -1
};
} },
{ order:333, run(__ctx:Runtime){__ctx.drawScenarioImage=function(c,w,h,sc,alpha=.72){__ctx.drawLivingWorld(c,w,h,sc,__ctx.artHazard(),performance.now(),true);return true;};
} },
{ order:334, run(__ctx:Runtime){__ctx.animateSceneCanvas=function(ts){
 requestAnimationFrame(__ctx.animateSceneCanvas);if(__ctx.browser.document.hidden||ts-__ctx.livingArt.lastHero<(__ctx.livingArt.reduced?500:33))return;__ctx.livingArt.lastHero=ts;
 const c=__ctx.sceneEngine.ctx;if(!c)return;__ctx.sceneEngine.t=ts;__ctx.drawLivingWorld(c,__ctx.sceneEngine.w,__ctx.sceneEngine.h,__ctx.viewState.scenario||'ice',__ctx.artHazard(),ts);__ctx.artSettlement(c,__ctx.sceneEngine.w,__ctx.sceneEngine.h,ts);
};
} },
{ order:335, run(__ctx:Runtime){__ctx.animateMapScene=function(ts){
 requestAnimationFrame(__ctx.animateMapScene);if(__ctx.browser.document.hidden||ts-__ctx.livingArt.lastMap<(__ctx.livingArt.reduced?500:50))return;__ctx.livingArt.lastMap=ts;
 const c=__ctx.mapSceneEngine.ctx;if(!c)return;__ctx.mapSceneEngine.t=ts;const w=__ctx.mapSceneEngine.w,h=__ctx.mapSceneEngine.h;
 __ctx.drawLivingWorld(c,w,h,__ctx.viewState.scenario||'ice',__ctx.artHazard(),ts,true);__ctx.artSettlement(c,w,h,ts);
};
} },
{ order:336, run(__ctx:Runtime){__ctx.animateCinematic=function(ts){
 requestAnimationFrame(__ctx.animateCinematic);if(__ctx.browser.document.hidden||ts-__ctx.livingArt.lastCinema<(__ctx.livingArt.reduced?500:33))return;__ctx.livingArt.lastCinema=ts;
 const c=__ctx.cinematicEngine.ctx;if(!c)return;const w=__ctx.cinematicEngine.w,h=__ctx.cinematicEngine.h;c.clearRect(0,0,w,h);
 if(!__ctx.cinematicEngine.active||!__ctx.viewState.scenario)return;__ctx.drawLivingWorld(c,w,h,__ctx.viewState.scenario,__ctx.artHazard(),ts);__ctx.artSettlement(c,w,h,ts);
 c.fillStyle=__ctx.cinematicEngine.type==='crisis'?'rgba(32,4,9,.18)':'rgba(5,13,18,.16)';c.fillRect(0,0,w,h);
};
} },
{ order:337, run(__ctx:Runtime){__ctx.artOriginalAtmosphere = __ctx.updateDynamicAtmosphere;
} },
{ order:540, run(__ctx:Runtime){__ctx.createFinalReportCanvases=function(){const pages=__ctx.physicalReport();if(!__ctx.viewState.physical)return pages;const c=__ctx.browser.document.createElement('canvas');c.width=1240;c.height=1754;const ctx=c.getContext('2d'),p=__ctx.viewState.physical,e=__ctx.viewState.environment,sv=p.lastServices||__ctx.physicalServices();ctx.fillStyle='#0b1c22';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#cdddac';ctx.font='bold 38px sans-serif';ctx.fillText('ПРЕДЕЛ V16 · УСЛОВИЯ ЖИЗНИ',70,100);ctx.fillStyle='#dbe7e2';ctx.font='24px sans-serif';let y=175;const line=(label,value)=>{ctx.fillStyle='#9cb4ad';ctx.fillText(label,70,y);ctx.fillStyle='#eef4e4';ctx.fillText(String(value),720,y);y+=55;};line('Месяц кампании',__ctx.viewState.month+' / 84');line('Сценарий',__ctx.scenarios[__ctx.viewState.scenario].name);line('Живы / спасено / потери',Math.round(__ctx.viewState.population)+' / '+__ctx.viewState.rescuedTotal+' / '+__ctx.viewState.deathsTotal.toFixed(1));line('Температура жилья',sv.indoor.toFixed(1)+' °C');line('CO₂ · расчётная оценка',Math.round(sv.co2)+' ppm');line('Пациенты / заразные',p.patients.toFixed(1)+' / '+p.infected.toFixed(1));if(__ctx.viewState.scenario==='nuclear'){line('Фон у убежища на конец месяца',e.radiation.toFixed(3)+' мкЗв/ч');line('Учёт дозы начат в месяце',p.doseHistoryStart);line('Доза постоянного жителя',p.residentLifetimeDose.toFixed(3)+' мЗв');line('Станция дезактивации',__ctx.viewState.built.decon?'уровень '+__ctx.viewState.built.decon:'не построена');}y+=30;ctx.fillStyle='#cdddac';ctx.font='bold 28px sans-serif';ctx.fillText('Последний месячный цикл здоровья',70,y);y+=60;ctx.font='24px sans-serif';for(const [k,v] of __ctx.entries(p.lastHealthLedger?.causes||{}))if(Math.abs(v)>.0001)line(__ctx.healthCauseNames[k]||k,(v>=0?'+':'')+v.toFixed(3)+' п.п.');ctx.fillStyle='#9cb4ad';ctx.font='21px sans-serif';const notes=['Доза жителей и наружных групп учитывается отдельно.','До обновления V15 история облучения не восстанавливается догадками.','Клинические последствия и инженерные параметры — модель игры.','Жизни людей сохраняют наибольший вес в итоговой оценке.'];y=Math.max(y+60,1450);for(const note of notes){ctx.fillText(note,70,y);y+=38;}pages.push(c);return pages;};
} },
{ order:630, run(__ctx:Runtime){__ctx.createFinalReportCanvases=function(){const pages=__ctx.balancedReport(),a=__ctx.autonomyData(),c=__ctx.browser.document.createElement('canvas');c.width=1240;c.height=1754;const ctx=c.getContext('2d');ctx.fillStyle='#0b1c22';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#dce9c0';ctx.font='bold 38px sans-serif';ctx.fillText('ПРЕДЕЛ V16 · УСТОЙЧИВОСТЬ',70,110);ctx.font='26px sans-serif';let y=190;for(const line of [a.title,'Стабильных месяцев: '+__ctx.viewState.balance.stableMonths+' / 6','Обеспечение на год: '+Math.round(a.supply*100)+'%','Медицинская мощность: '+Math.round(a.medical*100)+'%',__ctx.viewState.scenario==='nuclear'?'Защищены: '+Math.round(a.protectedCoverage*100)+'% жителей':'Общие правила жизнеобеспечения',__ctx.viewState.balance.legacy?'Перенесённая партия с унаследованными возможностями':'Партия начата по правилам V16']){ctx.fillText(line,70,y);y+=62;}y+=45;for(const r of a.rows){ctx.fillText(__ctx.labelRes(r.key)+': '+(Number.isFinite(r.months)?r.months.toFixed(1)+' мес. при дефиците':'баланс покрыт'),70,y);y+=60;}ctx.font='22px sans-serif';ctx.fillText('Прогноз зависит от сохранения нагрузки и производственных цепочек.',70,1470);ctx.fillText('Главная оценка кампании — сохранённые жизни и потери.',70,1520);pages.push(c);return pages;};
} }
];
