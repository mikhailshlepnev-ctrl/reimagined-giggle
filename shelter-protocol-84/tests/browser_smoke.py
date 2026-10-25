"""Regression against the mounted app using only public game commands and saved DTOs.
Test-only fixtures enter through the same loadGame validation/migration as user saves.
"""
from pathlib import Path
from copy import deepcopy
import json
import os
import shutil
from playwright.sync_api import sync_playwright

URL=os.environ.get('PREDEL_TEST_URL','http://127.0.0.1:5173/')
RESULTS=Path(__file__).resolve().parent.parent/'test-results'
RESULTS.mkdir(exist_ok=True)
KEY='PREDEL_SAVE_V5'
results=[]
def run(name, fn):
    try:
        value=fn()
        if value is False:raise AssertionError('returned false')
        results.append({'name':name,'ok':True});print('PASS',name,flush=True)
    except Exception as error:
        results.append({'name':name,'ok':False,'error':str(error)});print('FAIL',name,str(error),flush=True)
def saved(page):
    return page.evaluate("JSON.parse(localStorage.getItem('PREDEL_SAVE_V5'))")
def load(page, fixture):
    result=page.evaluate("s=>{localStorage.setItem('PREDEL_SAVE_V5',JSON.stringify(s));return game.loadGame();}",fixture)
    assert result is not False, 'loadGame rejected fixture'
    return saved(page)
def open_tab(page,tab):
    if page.locator('.ccDrawer').evaluate('(d)=>d.open'):page.locator('.ccDrawerClose').click()
    page.locator(f'[data-tab="{tab}"]').click()

def clean(base):
    s=deepcopy(base);s.update(ended=False,finalWin=None,event=None,pendingEvent=None,actions=20,voiceEnabled=False)
    s['community']={'nextOfferMonth':s['month']+20,'offer':None}
    return s

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
    errors=[];console=[];http_errors=[]
    page.on('response',lambda response:http_errors.append({'status':response.status,'url':response.url}) if response.status>=400 else None)
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('console',lambda message:console.append(message.text) if message.type=='error' else None)
    page.goto(URL,wait_until='domcontentloaded')
    page.locator('.scenario[data-s="heat"]').click();page.locator('#startBtn').click()
    page.wait_for_selector('#introContinue');page.locator('#introContinue').click();page.locator('#centerContent button.primary').first.click();page.evaluate('game.saveGame()');page.wait_for_timeout(4200)
    base=saved(page)
    assert base and base['site']
    run('real start and site selection',lambda:base['prepMonths']==18 and base['month']==0 and bool(page.locator('#housingPanel').count()))
    def build():
        before=saved(page);page.evaluate("game.buildModule('habitat')");after=saved(page)
        assert after['bunker']['capacity']>before['bunker']['capacity']
        assert str(int(after['bunker']['capacity'])) in page.locator('.ccPeople strong').text_content()
        assert page.locator('#isometricWorld').count()==1
        assert page.locator('.ccCamera select option[value="habitat:1"]').count()==1
        return True
    run('build habitat updates capacity and mounted cutaway',build)
    base=saved(page)
    for tab in ['build','map','city','printer','population','technology','operations','production','forecast']:
        def check_tab(tab=tab):
            open_tab(page,tab)
            text=page.locator('#tabContent').inner_text()
            assert len(text)>40,(tab,text)
            return True
        run('tab '+tab,check_tab)
    def trade():
        s=clean(base);s['built']['radioCenter']=2;s['radioContact']={'name':'Тестовый узел','trust':70,'distance':12};s['resources'].update(parts=30,precisionParts=12);load(page,s);open_tab(page,'city')
        for id in ['tradeGive','tradeWant']:
            for resource in ['parts','precisionParts']:assert page.locator(f'#{id} option[value="{resource}"]').count()==1
        page.select_option('#tradeGive','parts');page.select_option('#tradeWant','precisionParts');page.fill('#tradeAmount','5');page.select_option('#tradeTeam','5')
        before=saved(page);page.evaluate('game.tradeExpedition()');after=saved(page)
        assert after['resources']['parts']==before['resources']['parts']-5
        assert after['actions']==before['actions']-1
        assert after['resources']['precisionParts']>before['resources']['precisionParts'] or after['deathsTotal']>before['deathsTotal']
        return True
    run('manual parts trade ledger and real expedition',trade)
    def incoming():
        s=clean(base);s['built']['radioCenter']=1;s['radioContact']={'name':'Тестовый узел','trust':60,'distance':12};s['resources'].update(parts=30,precisionParts=12);s['community']={'nextOfferMonth':5,'offer':{'requested':'parts','offered':'precisionParts','amount':4,'receive':2,'month':0,'expires':3}}
        load(page,s);open_tab(page,'city');assert page.locator('#incomingTradeOffer').count()==1;assert page.locator('.radioIncomingNotice').count()==1
        page.locator('.ccDrawerClose').click();page.locator('.ccDispatch').click();page.locator('.radioIncomingNotice button').click();assert page.locator('#incomingTradeOffer').is_visible() and 'Экспедиции' in page.locator('#ccDrawerTitle').inner_text()
        page.evaluate('game.answerTradeOffer(true)');a=saved(page);assert a['resources']['parts']==26 and a['resources']['precisionParts']==14 and a['actions']==19 and a['community']['offer'] is None
        page.evaluate('game.answerTradeOffer(true)');assert saved(page)['resources']['parts']==26
        return True
    run('incoming offer shows and accepts once',incoming)
    def monthly_offer():
        s=clean(base);s['radioContact']={'name':'Тестовый узел','trust':60,'distance':12};s['built']['radioCenter']=1;s['community']={'nextOfferMonth':1,'offer':None};s['resources'].update(parts=100,precisionParts=40,food=1000,fuel=1000,medicine=100)
        load(page,s);page.evaluate('game.nextMonth()');after=saved(page)
        assert after['month']==1 and after['community']['offer'] and after['community']['offer']['expires']==4
        return True
    run('monthly turn generates due radio proposal',monthly_offer)
    def rescue():
        s=clean(base);s['bunker']['capacity']=80;s['cityAccess']=0;s['rescuePoint']={'remaining':14,'rescued':0,'lastMonth':-999};s['resources'].update(food=300,fuel=100);s['terrain']['discoveredSites']=list(set(s['terrain'].get('discoveredSites',[])+['evacuation']));load(page,s);open_tab(page,'city')
        card=page.locator('#evacuationMission');assert card.count()==1 and card.locator('button.primary').is_enabled()
        before=saved(page);page.evaluate('game.evacuateSurvivors()');after=saved(page)
        assert after['actions']==before['actions']-1 and after['resources']['food']==before['resources']['food']-1 and after['rescuePoint']['lastMonth']==after['month']
        assert after['rescuePoint']['remaining']<before['rescuePoint']['remaining'] or after['deathsTotal']>before['deathsTotal']
        page.evaluate('game.evacuateSurvivors()');assert saved(page)['actions']==after['actions']
        return True
    run('discovered rescue survives closed city and finite mission',rescue)
    def lateworld():
        s=clean(base);s.update(scenario='ice',month=75,phase='Новая среда',environment=None);load(page,s);page.wait_for_timeout(600)
        title=page.locator('#sceneContent .sceneTitle').text_content();assert 'спокойные' not in title and 'ледяным' in title
        assert page.locator('#sceneCanvas').get_attribute('data-phase')=='3'
        page.locator('.ccDrawerClose').click() if page.locator('.ccDrawer').evaluate('(d)=>d.open') else None
        page.locator('[data-action="surface"]').click()
        page.locator('.sceneHero').screenshot(path=str(RESULTS/'modular-late-world.png'))
        page.locator('.ccDrawerClose').click()
        return True
    run('late world retains phase and ruins',lateworld)
    def pending():
        s=clean(base);s['pendingEvent']={'title':'Повреждение насосов','data':{}};load(page,s)
        assert 'Повреждение насосов' in page.locator('#eventBox').text_content()
        assert page.locator('#eventBox .eventChoices button').count()>0
        page.evaluate('game.saveGame()');reloaded=saved(page);assert reloaded['pendingEvent']['title']=='Повреждение насосов'
        page.evaluate('game.loadGame()');assert 'Повреждение насосов' in page.locator('#eventBox').text_content()
        page.evaluate('game.resolveEvent(1)');assert saved(page)['pendingEvent'] is None
        return True
    run('pending event save/load and resolution',pending)
    def endgame():
        s=clean(base);s.update(month=84,phase='Новая среда',ended=True,finalWin=True,endReason='Тест: итог кампании');load(page,s)
        assert page.locator('#endOverlay').is_visible() and 'ВЫЖИЛИ' in page.locator('#endModal').text_content()
        page.evaluate('game.saveGame()');assert saved(page)['ended']
        return True
    run('completed save restores final overlay',endgame)
    def pdf():
        with page.expect_download(timeout=20000) as download_info:page.evaluate('game.generateFinalPDF()')
        download=download_info.value;path=Path(str(RESULTS/'modular-final-report.pdf'));download.save_as(path);assert path.read_bytes().startswith(b'%PDF') and path.stat().st_size>10000
        return True
    run('final report PDF actual download',pdf)
    # Restore active fixtures rather than leaving an end overlay over controls.
    load(page,clean(base));page.locator('.ccDrawerClose').click() if page.locator('.ccDrawer').evaluate('(d)=>d.open') else None;page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100)
    run('mobile no horizontal overflow',lambda:page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.screenshot(path=str(RESULTS/'modular-mobile.png'))
    page.set_viewport_size({'width':1440,'height':1000})
    for scenario in ['ice','heat','nuclear','epidemic']:
        def sound(scenario=scenario):
            s=clean(base);s.update(scenario=scenario,month=22,phase='Обрушение',environment=None,voiceEnabled=False);load(page,s)
            page.wait_for_timeout(7400)
            return True
        run('sound timer scenario '+scenario,sound)
    def camera_readonly():
        before=saved(page)
        page.locator('.ccCamera select').select_option('base:water')
        assert page.locator('.ccInspector').is_visible()
        page.locator('[data-action="zoomIn"]').click();page.locator('[data-action="fit"]').click()
        assert saved(page)==before
        page.locator('.ccInspectorClose').click()
        return True
    run('camera and room selection never mutate simulation',camera_readonly)
    def keyboard_drawer():
        page.locator('#isometricWorld').focus();page.keyboard.press('1')
        assert page.locator('.ccDrawer').evaluate('(d)=>d.open')
        page.keyboard.press('Escape')
        assert not page.locator('.ccDrawer').evaluate('(d)=>d.open')
        return True
    run('keyboard navigation and escape close',keyboard_drawer)
    run('browser uncaught errors empty',lambda:not errors)
    print('ERRORS',json.dumps(errors,ensure_ascii=False));print('CONSOLE ERRORS',json.dumps(console,ensure_ascii=False));print('HTTP ERRORS',json.dumps(http_errors,ensure_ascii=False))
    Path(str(RESULTS/'modular-browser-results.json')).write_text(json.dumps({'checks':results,'pageErrors':errors,'consoleErrors':console,'httpErrors':http_errors},ensure_ascii=False,indent=2))
    browser.close()
print('TOTAL',sum(x['ok'] for x in results),'/',len(results),flush=True)
