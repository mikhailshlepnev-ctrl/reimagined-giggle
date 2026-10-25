/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.presentEndGame=function(win,reason){const r=__ctx.resilience(),hm=__ctx.humanitarianMetrics();const end=__ctx.browser.document.getElementById('endOverlay');__ctx.browser.document.getElementById('endModal').innerHTML=`<div class="huge">${win?'ВЫЖИЛИ':'КОЛЛАПС'}</div><h2>${reason}</h2><p class="muted">Главная оценка кампании — человеческие жизни. Инфраструктура важна прежде всего потому, что позволяет принять и сохранить больше людей.</p><div class="summary"><div class="box"><b>Живы в финале</b><div class="huge">${Math.round(hm.survivors)}</div></div><div class="box"><b>Спасено с поверхности</b><div class="huge">+${Math.round(hm.rescued)}</div></div><div class="box"><b>Потери</b><div class="huge">−${Math.round(hm.deaths)}</div></div><div class="box"><b>Гуманитарный рейтинг</b><div class="huge">${hm.grade}</div><div>${hm.index}/100</div></div><div class="box"><b>Итоговый счёт</b><div class="huge">${__ctx.viewState.score}</div><small>гуманитарная часть ${hm.humanitarian} · системы ${hm.systems}</small></div><div class="box"><b>Устойчивость</b><div class="huge">${Math.round(r)}%</div><div>${__ctx.currentStage().icon} ${__ctx.currentStage().name}</div></div></div><p>Беженцев дошло до периметра: <b>${Math.round(hm.arrivals)}</b> · принято: <b>${Math.round(hm.accepted)}</b> · отказано: <b>${Math.round(hm.refused)}</b>.</p><p>${__ctx.scenarios[__ctx.viewState.scenario].final}</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="primary" onclick="game.generateFinalPDF()">📄 Скачать итоговый PDF</button><button onclick="location.reload()">Новая игра</button></div>`;end.style.display='grid';
};

__ctx.reportCoverImage = function reportCoverImage(ctx,img,x,y,w,h){if(!img||!img.complete)return;const ir=img.naturalWidth/img.naturalHeight,rr=w/h;let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;if(ir>rr){sw=sh*rr;sx=(img.naturalWidth-sw)/2}else{sh=sw/rr;sy=(img.naturalHeight-sh)/2}ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);};

__ctx.reportWrap = function reportWrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){const words=String(text).split(/\s+/);let line='',lines=0;for(let i=0;i<words.length;i++){const test=line?line+' '+words[i]:words[i];if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;lines++;line=words[i];if(lines>=maxLines)return y}else line=test}if(line&&lines<maxLines){ctx.fillText(line,x,y);y+=lineHeight}return y;};

__ctx.reportCard = function reportCard(ctx,x,y,w,h,title,value,sub,accent){ctx.fillStyle='rgba(14,22,31,.92)';ctx.beginPath();ctx.roundRect(x,y,w,h,22);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#9fb0be';ctx.font='600 24px system-ui,sans-serif';ctx.fillText(title,x+24,y+38);ctx.fillStyle='#f4f8fb';ctx.font='800 52px system-ui,sans-serif';ctx.fillText(String(value),x+24,y+96);if(sub){ctx.fillStyle='#b8c7d2';ctx.font='400 20px system-ui,sans-serif';__ctx.reportWrap(ctx,sub,x+24,y+128,w-48,26,2)}};

__ctx.dataUrlBytes = function dataUrlBytes(url){const b64=url.split(',')[1],bin=atob(b64),out: any=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;};

__ctx.buildImagePDF = function buildImagePDF(canvases){
 const enc: any=new TextEncoder(),chunks=[],offsets=[0];let len=0;const push=(b)=>{if(typeof b==='string')b=enc.encode(b);chunks.push(b);len+=b.length};push('%PDF-1.4\n% PREDEL REPORT\n');const n=canvases.length,objCount=2+n*3;
 const obj=(num,body,bytes=null)=>{offsets[num]=len;push(`${num} 0 obj\n${body}`);if(bytes){push('stream\n');push(bytes);push('\nendstream\nendobj\n')}else push('endobj\n')};
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>\n');const kids=[];for(let i=0;i<n;i++)kids.push(`${3+i*3} 0 R`);obj(2,`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${n} >>\n`);
 for(let i=0;i<n;i++){const page=3+i*3,content=4+i*3,image=5+i*3,jpg=__ctx.dataUrlBytes(canvases[i].toDataURL('image/jpeg',.91)),stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';obj(page,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${image} 0 R >> >> /Contents ${content} 0 R >>\n`);obj(content,`<< /Length ${enc.encode(stream).length} >>\n`,enc.encode(stream));obj(image,`<< /Type /XObject /Subtype /Image /Width ${canvases[i].width} /Height ${canvases[i].height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\n`,jpg)}
 const xref=len;push(`xref\n0 ${objCount+1}\n0000000000 65535 f \n`);for(let i=1;i<=objCount;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);push(`trailer\n<< /Size ${objCount+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'});
};

__ctx.generateFinalPDF = function generateFinalPDF(){try{const pages=__ctx.createFinalReportCanvases(),blob=__ctx.buildImagePDF(pages),url=URL.createObjectURL(blob),a=__ctx.browser.document.createElement('a'),hm=__ctx.humanitarianMetrics();a.href=url;a.download=`PREDEL_${__ctx.viewState.scenario||'report'}_${hm.grade}_${new Date().toISOString().slice(0,10)}.pdf`;__ctx.browser.document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);__ctx.logMsg('📄 Итоговый PDF-отчёт сформирован.','good');}catch(e){console.error(e);alert('Не удалось сформировать PDF-отчёт в этом браузере.');}};
}
export const steps: Initialization[] = [
{ order:319, run(__ctx:Runtime){__ctx.reportCoverImage=function(ctx,img,x,y,w,h){ctx.save();ctx.translate(x,y);__ctx.drawLivingWorld(ctx,w,h,__ctx.viewState.scenario,__ctx.viewState.environment?.severity||__ctx.viewState.hazard||0,18000,false);__ctx.artSettlement(ctx,w,h,18000);ctx.fillStyle='rgba(6,15,20,.32)';ctx.fillRect(0,0,w,h);ctx.restore();};
} },
{ order:539, run(__ctx:Runtime){__ctx.physicalReport = __ctx.createFinalReportCanvases;
} },
{ order:629, run(__ctx:Runtime){__ctx.balancedReport = __ctx.createFinalReportCanvases;
} }
];
