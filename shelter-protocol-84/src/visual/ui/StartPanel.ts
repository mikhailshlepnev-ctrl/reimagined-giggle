/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.showScenarioIntro = function showScenarioIntro(sc=__ctx.viewState.scenario,replay=false){
 if(!__ctx.scenarioBriefings[sc])return;const brief=__ctx.scenarioBriefings[sc];let overlay=__ctx.browser.document.getElementById('scenarioIntro');if(!overlay){overlay=__ctx.browser.document.createElement('div');overlay.id='scenarioIntro';overlay.className='overlay introOverlay';__ctx.browser.document.body.append(overlay);}__ctx.introProgress=0;
 overlay.style.display='grid';overlay.innerHTML=`<div class="introModal" role="dialog" aria-modal="true" aria-labelledby="introTitle"><div class="introWorld"><canvas id="introWorldCanvas" width="1400" height="420"></canvas><div class="introWorldShade"></div><div class="introTitle"><span class="eyebrow">ДОСЬЕ ${Object.keys(__ctx.scenarios).indexOf(sc)+1} / ОПЕРАЦИЯ «ПРЕДЕЛ»</span><h1 id="introTitle">${__ctx.scenarios[sc].name}</h1><p>${brief.subtitle}</p></div></div><div class="introBody"><div class="introChapters">${[['Сейчас',0],['Обрушение',50],['Новая среда',96]].map(([t,p],i)=>`<button class="${i===0?'active':''}" onclick="game.setIntroProgress(${p},this)">${t}</button>`).join('')}</div><div class="introConditions">${brief.conditions.map(([t,p],i)=>`<article><span>0${i+1}</span><h3>${t}</h3><p>${p}</p></article>`).join('')}</div><div class="introMission"><div><b>18 месяцев подготовки · 84 месяца кампании</b><p>Главная цель — спасти как можно больше людей и потерять как можно меньше. Человеческие жизни имеют наибольший вес в итоговой оценке и PDF.</p></div><button class="primary" id="introContinue" onclick="game.closeScenarioIntro()">${replay?'Вернуться в поселение':'Начать подготовку'} →</button></div></div></div>`;
 cancelAnimationFrame(__ctx.introFrame);function frame(ts){if(overlay.style.display==='none')return;const c=__ctx.browser.document.getElementById('introWorldCanvas');if(c&&typeof __ctx.drawLivingWorld==='function')__ctx.drawLivingWorld(c.getContext('2d'),1400,420,sc,__ctx.introProgress,ts,false);__ctx.introFrame=requestAnimationFrame(frame);}__ctx.introFrame=requestAnimationFrame(frame);setTimeout(()=>__ctx.browser.document.getElementById('introContinue')?.focus(),150);if(__ctx.browser.window.PredelAudio)__ctx.browser.window.PredelAudio.intro(sc);else __ctx.aiSpeak(brief.conditions.map(([t,p])=>t+'. '+p).join(' '),'queue');
};

__ctx.setIntroProgress = function setIntroProgress(p,button){__ctx.introProgress=p;__ctx.browser.document.querySelectorAll('.introChapters button').forEach(b=>b.classList.remove('active'));button.classList.add('active');};

__ctx.closeScenarioIntro = function closeScenarioIntro(){const e=__ctx.browser.document.getElementById('scenarioIntro');if(e)e.style.display='none';cancelAnimationFrame(__ctx.introFrame);__ctx.browser.window.PredelAudio?.stop();if(!__ctx.viewState.site)__ctx.browser.document.querySelector('#centerContent button')?.focus();};
}
export const steps: Initialization[] = [
{ order:281, run(__ctx:Runtime){__ctx.introFrame = 0;
} },
{ order:281, run(__ctx:Runtime){__ctx.introProgress = 0;
} }
];
