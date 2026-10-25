/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.renderEvent = function renderEvent(){const b=__ctx.browser.document.getElementById('eventBox');if(!__ctx.viewState.event){b.innerHTML=`<div class="event"><h4>${__ctx.viewState.month<=__ctx.viewState.prepMonths?'Окно возможностей':'Текущий режим'}</h4><p>${__ctx.viewState.month<=__ctx.viewState.prepMonths?'Используйте время для строительства и вывоза ресурсов. После обрушения инфраструктуры большинство городских источников исчезнет.':'Система работает в условиях нарастающей изоляции. Следите за запасами, климатом, водой и ремонтопригодностью.'}</p></div>`;return}b.innerHTML=`<div class="event"><h4>${__ctx.viewState.event.title}</h4><p>${__ctx.viewState.event.text}</p><div class="eventChoices">${__ctx.viewState.event.choices.map((c,i)=>`<button onclick="game.resolveEvent(${i})">${c[0]}</button>`).join('')}</div></div>`};
}
export const steps: Initialization[] = [
{ order:377, run(__ctx:Runtime){__ctx.renderEvent=function(){
 __ctx.stabilityRenderEvent();if(!__ctx.viewState.event)return;
 __ctx.browser.document.querySelectorAll('#eventBox .eventChoices button').forEach((button,i)=>{
  const req=__ctx.eventChoiceRequirements(__ctx.viewState.event,i);button.disabled=!!req.reason;
  if(req.reason)button.title=req.reason;
  const costs=__ctx.entries(req.cost).filter(([,v])=>v>0);
  if(costs.length){const info=__ctx.browser.document.createElement('small');info.className='eventCost '+(__ctx.canPay(req.cost)?'good':'warn');info.textContent=costs.map(([r,v])=>`${__ctx.labelRes(r)}: ${__ctx.fmtResource(__ctx.viewState.resources[r]||0)} / ${__ctx.fmtResource(v)}`).join(' · ')+(req.reason?' · '+req.reason:!__ctx.canPay(req.cost)?' · аварийный режим':'');button.append(info);}
 });
};
} },
{ order:517, run(__ctx:Runtime){__ctx.renderEvent=function(){__ctx.physicalRenderEvent();if(__ctx.viewState.site&&!__ctx.viewState.event){const p=__ctx.viewState.physical,d=__ctx.deconStatus();__ctx.browser.document.getElementById('eventBox').innerHTML=`<div class="event"><h4>Оперативная сводка</h4><p>${__ctx.escapeHTML(p.lastTrend?.text||'Подготовка поселения. До выпадений и изоляции развивайте жизнеобеспечение, ремонт и резерв запасов.')}</p><p>Проходимость городских путей: ${Math.round(__ctx.viewState.cityAccess)}%. ${__ctx.falloutActive()?d.available?'Санитарный шлюз работает.':__ctx.escapeHTML(d.reason)+'.':'Доступность определяется состоянием дорог и погодой.'}</p></div>`;}};
} },
{ order:660, run(__ctx:Runtime){__ctx.renderEvent=function(){__ctx.v17RenderEvent();if(!__ctx.viewState.site||!__ctx.viewState.community?.offer||!__ctx.viewState.radioContact)return;const o=__ctx.viewState.community.offer;if(__ctx.viewState.month>o.expires)return;__ctx.browser.document.getElementById('eventBox').insertAdjacentHTML('beforeend',`<div class="radioIncomingNotice"><span>📻 Входящий запрос · до М${o.expires}</span><b>${__ctx.escapeHTML(__ctx.viewState.radioContact.name)}</b><p>${__ctx.labelRes(o.requested)} ${__ctx.fmtResource(o.amount)} ↔ ${__ctx.labelRes(o.offered)} ${__ctx.fmtResource(o.receive)}</p><button onclick="game.showTab('city');document.getElementById('incomingTradeOffer')?.scrollIntoView({block:'center'})">Посмотреть условия →</button></div>`);};
} }
];
