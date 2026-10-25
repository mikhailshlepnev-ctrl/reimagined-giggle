"""Offline production regression. Run npm run build, then python tests/standalone_smoke.py.
Requires Python Playwright and Chromium. Screenshots/reports stay in test-results/.
"""
from pathlib import Path
import json
from copy import deepcopy
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
RESULTS=ROOT/'test-results'
RESULTS.mkdir(exist_ok=True)
checks=[]
def check(name,fn):
 fn();checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1536,'height':1000},reduced_motion='reduce')
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('http://predel.local/',lambda route:route.fulfill(body='<!doctype html><html lang="ru"><body></body></html>',content_type='text/html'))
 page.goto('http://predel.local/');ctx.set_offline(True);requests=[];page.on('request',lambda req: requests.append(req.url) if req.url.startswith('http') else None)
 page.set_content((ROOT/'dist/Predel.html').read_text(),wait_until='domcontentloaded')
 page.locator('.scenario[data-s="heat"]').click();page.locator('#startBtn').click();page.locator('#introContinue').click();page.locator('#centerContent button.primary').first.click();page.evaluate('game.saveGame()');page.wait_for_timeout(1000)
 base=page.evaluate("JSON.parse(localStorage.getItem('PREDEL_SAVE_V5'))")
 assert base['site'];check('standalone starts and site selection works offline',lambda:None)
 def load(s):page.evaluate("s=>{localStorage.setItem('PREDEL_SAVE_V5',JSON.stringify(s));game.loadGame()}",s)
 s=deepcopy(base);s.update(actions=20,voiceEnabled=False,event=None,pendingEvent=None);s['resources'].update(parts=100,precisionParts=40,fuel=1000,food=1000);s['built'].update(habitat=2,water=1,farm=1,radioCenter=1,med=1);s['bunker'].update(capacity=65,integrity=70);s['radioContact']={'name':'Поселение за перевалом','trust':60,'distance':12};s['community']={'nextOfferMonth':10,'offer':{'requested':'parts','offered':'precisionParts','amount':4,'receive':2,'month':0,'expires':3}};s['terrain']['discoveredSites']=list(set(s['terrain'].get('discoveredSites',[])+['evacuation']));s['rescuePoint']={'remaining':14,'rescued':0,'lastMonth':-999};load(s)
 for width,height in [(1536,1000),(390,844),(320,568),(844,390)]:
  page.set_viewport_size({'width':width,'height':height});page.locator('.ccCamera select').select_option('base:water')
  page.locator('[data-action="zoomIn"]').click();page.locator('[data-action="fit"]').click()
  panel=page.locator('.ccInspector');panel.evaluate('e=>e.scrollTop=e.scrollHeight');page.locator('.ccRoomMore').click();assert page.locator('.ccDrawer').evaluate('e=>e.open');page.keyboard.press('Escape');panel.evaluate('e=>e.scrollTop=0');page.locator('.ccInspectorClose').click()
  check(f'{width}x{height}: room inspector text, camera and last action reachable',lambda:None)
  page.evaluate("game.showTab('city')");body=page.locator('.ccDrawerBody');assert body.evaluate('e=>e.scrollWidth<=e.clientWidth+1');assert page.locator('#incomingTradeOffer').count()==1;assert page.locator('#evacuationMission').count()==1;body.evaluate('e=>e.scrollTop=e.scrollHeight');page.keyboard.press('Escape');check(f'{width}x{height}: incoming trade and evacuation layout fits',lambda:None)
 # Capture main contrast at the same stable camera; state enters through validated save loading.
 page.set_viewport_size({'width':1536,'height':1000});load(s);page.wait_for_timeout(900);page.screenshot(path=str(RESULTS/'interface-v19-before.png'))
 s.update(month=45,phase='Глубокий кризис',hazard=82,environment=None);load(s);page.evaluate("PredelCinema.ready('heat')");page.wait_for_timeout(1000);page.screenshot(path=str(RESULTS/'interface-v19.png'))
 page.locator('.ccExpand').click();assert page.locator('.ccSurface #sceneCanvas').is_visible();page.locator('.ccBriefing').click();assert not page.locator('.ccDrawer').evaluate('e=>e.open');page.locator('#introContinue').click();assert page.locator('.ccDrawer').evaluate('e=>e.open');page.keyboard.press('Escape');page.wait_for_timeout(100);assert page.locator('.ccExteriorFeed #sceneCanvas').count()==1;check('standalone panorama, briefing and return use the same live canvas',lambda:None)
 page.set_viewport_size({'width':390,'height':844});s.update(scenario='ice',environment=None);load(s);page.evaluate("PredelCinema.ready('ice')");page.wait_for_timeout(1000);page.screenshot(path=str(RESULTS/'interface-v19-mobile.png'))
 assert not errors,errors;assert not requests,requests;check('standalone has no external network requests or script errors',lambda:None)
 print('TOTAL',len(checks));(ROOT/'test-results/standalone-v19.json').write_text(json.dumps({'checks':checks,'errors':errors,'requests':requests},ensure_ascii=False,indent=2))
 b.close()
