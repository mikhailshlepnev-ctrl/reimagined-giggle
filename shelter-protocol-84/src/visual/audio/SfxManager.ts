/** Extracted from the verified Predel V17 implementation. Gameplay values are unchanged. */
import type { Runtime, Initialization } from '../../core/Runtime';

export function define(__ctx: Runtime):void {
__ctx.tone = function tone(freq,duration=.18,type='sine',gain=.04,delay=0){
 if(!__ctx.audioEngine.ctx||__ctx.audioEngine.muted)return; const ctx=__ctx.audioEngine.ctx, now=ctx.currentTime+delay;
 const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.018);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(__ctx.audioEngine.master);o.start(now);o.stop(now+duration+.03);
};

__ctx.noiseHit = function noiseHit(duration=.22,gain=.05,lowpass=520){
 if(!__ctx.audioEngine.ctx||__ctx.audioEngine.muted)return; const ctx=__ctx.audioEngine.ctx, src=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();src.buffer=__ctx.audioEngine.noiseBuffer;f.type='lowpass';f.frequency.value=lowpass;g.gain.value=.0001;src.connect(f);f.connect(g);g.connect(__ctx.audioEngine.master);const now=ctx.currentTime;g.gain.exponentialRampToValueAtTime(gain,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);src.start(now);src.stop(now+duration+.02);
};

__ctx.playEventCue = function playEventCue(kind='event'){
 if(!__ctx.audioEngine.ctx||__ctx.audioEngine.muted)return;
 if(kind==='phase'){__ctx.tone(330,.28,'sawtooth',.025,0);__ctx.tone(247,.34,'sawtooth',.028,.22);__ctx.tone(185,.42,'triangle',.038,.48);__ctx.noiseHit(.48,.035,380);__ctx.flashAlert();return;}
 if(kind==='good'){__ctx.tone(440,.16,'sine',.028);__ctx.tone(554,.2,'sine',.025,.14);return;}
 if(kind==='bad'){__ctx.noiseHit(.35,.055,300);__ctx.tone(96,.55,'triangle',.045,.03);__ctx.flashAlert();return;}
 if(__ctx.viewState.scenario==='nuclear'){__ctx.tone(880,.04,'square',.025);__ctx.tone(1160,.035,'square',.018,.08);__ctx.tone(910,.04,'square',.022,.15);}
 else if(__ctx.viewState.scenario==='ice'){__ctx.tone(620,.08,'triangle',.023);__ctx.tone(350,.22,'sine',.02,.08);}
 else if(__ctx.viewState.scenario==='epidemic'){__ctx.tone(760,.08,'square',.018);__ctx.tone(760,.08,'square',.018,.16);__ctx.tone(420,.22,'triangle',.02,.30);}
 else {__ctx.noiseHit(.20,.032,900);__ctx.tone(128,.30,'sine',.025,.06);}
 __ctx.flashAlert();
};

__ctx.speakEvent = function speakEvent(title){ __ctx.aiSpeak(title,'queue'); };

__ctx.announceEvent = function announceEvent(title){__ctx.playEventCue('event'); setTimeout(()=>__ctx.aiSpeak(`Новое событие. ${title}`,'normal'),180);};
}
export const steps: Initialization[] = [
{ order:313, run(__ctx:Runtime){__ctx.announceEvent=function(title){if(/Беженцы/.test(title)){__ctx.playEventCue('event');__ctx.browser.window.PredelAudio?.say('refugee_arrival',__ctx.viewState.event?.text||title,'normal');}else __ctx.originalAnnounceEvent(title);};
} },
{ order:344, run(__ctx:Runtime){__ctx.predelSound = (()=>{
  function ready(){return __ctx.audioEngine.ctx&&!__ctx.audioEngine.muted&&!__ctx.browser.document.hidden;}
  function out(node,pan=0){const c=__ctx.audioEngine.ctx;if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;node.connect(p);p.connect(__ctx.audioEngine.master);return p;}node.connect(__ctx.audioEngine.master);return null;}
  function note(f,d=.25,gain=.025,type='sine',delay=0,endFreq=0,pan=0){
    if(!ready())return;const c=__ctx.audioEngine.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(10,endFreq),t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(gain,t+Math.min(.025,d*.12));g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);const p=out(g,pan);o.start(t);o.stop(t+d+.025);o.onended=()=>{o.disconnect();g.disconnect();p?.disconnect();};
  }
  function noise(d=.3,gain=.02,f=500,q=.7,type='bandpass',delay=0,pan=0){
    if(!ready())return;const c=__ctx.audioEngine.ctx,t=c.currentTime+delay,o=c.createBufferSource(),flt=c.createBiquadFilter(),g=c.createGain();o.buffer=__ctx.audioEngine.noiseBuffer;flt.type=type;flt.frequency.value=f;flt.Q.value=q;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(gain,t+Math.min(.025,d*.15));g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(flt);flt.connect(g);const p=out(g,pan);o.start(t,Math.random());o.stop(t+d+.025);o.onended=()=>{o.disconnect();flt.disconnect();g.disconnect();p?.disconnect();};
  }
  function cue(kind){
    if(!ready())return;
    if(kind==='build'||kind==='upgrade'){noise(.1,.045,740,1.5,'bandpass');noise(.14,.025,1800,.9,'highpass',.13);note(280,.38,.018,'triangle',.1,115,-.2);note(820,.2,.006,'sine',.24);return;}
    if(kind==='printer'||kind==='gear'){noise(.4,.013,2200,2,'bandpass');note(240,.18,.016,'sine',0,520,-.2);note(420,.22,.011,'sine',.22,190,.3);noise(.08,.02,1100,2,'bandpass',.47);return;}
    if(kind==='scout'||kind==='radar'){note(980,.5,.018,'sine',0,950,-.15);note(980,.8,.007,'sine',.3,970,.4);noise(.14,.006,2200,1,'highpass',.25);return;}
    if(kind==='mission'){noise(.16,.025,440,.8,'bandpass',0,-.25);noise(.17,.022,370,.8,'bandpass',.19,.25);noise(.08,.012,1900,.7,'highpass',.4);note(420,.34,.016,'sine',.5);return;}
    if(kind==='phase'){note(125,.95,.032,'sine',0,83);noise(1.4,.045,155,.6,'lowpass');note(410,1.0,.008,'sine',.2,590,-.5);note(425,.9,.007,'sine',.28,610,.5);return;}
    if(kind==='bad'||kind==='casualty'){noise(.55,.035,190,.5,'lowpass');note(97,.9,.026,'sine',.04,62);note(196,.7,.006,'sine',.13,146);return;}
    if(kind==='good'){note(392,.3,.019,'sine');note(523.25,.48,.013,'sine',.17);note(784,.6,.005,'sine',.32);return;}
    if(kind==='weather'){noise(1.7,.065,115,.6,'lowpass');noise(.4,.009,2600,.6,'highpass',.08);return;}
    if(kind==='click'){noise(.025,.01,1700,1,'bandpass');return;}
    noise(.12,.015,2000,.8,'highpass',0,-.1);note(820,.09,.013,'sine',.09);note(640,.13,.011,'sine',.22);noise(.08,.008,1400,1,'bandpass',.38,.15);
  }
  return{note,noise,cue};
})();
} },
{ order:345, run(__ctx:Runtime){__ctx.playEventCue = function(kind='event'){__ctx.predelSound.cue(kind);if(kind==='bad'||kind==='phase')__ctx.flashAlert();};
} }
];
