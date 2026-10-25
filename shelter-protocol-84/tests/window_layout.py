"""Browser layout regression: real windows at desktop, portrait and landscape sizes.

Run against `npm run dev -- --port 8020` with Python Playwright and Chromium.
The fixtures use the game's public save/load boundary, never mutate live state.
"""
from copy import deepcopy
from pathlib import Path
import json
import os
import shutil
from playwright.sync_api import sync_playwright

URL = os.environ.get('PREDEL_TEST_URL', 'http://127.0.0.1:5173/')
RESULTS = Path(__file__).resolve().parent.parent / 'test-results'
RESULTS.mkdir(exist_ok=True)
checks = []

def check(name, function):
    try:
        function()
        checks.append({'name': name, 'ok': True})
        print('PASS', name, flush=True)
    except Exception as error:
        checks.append({'name': name, 'ok': False, 'error': str(error)})
        print('FAIL', name, error, flush=True)

def in_view(page, selector):
    assert page.locator(selector).evaluate('''n => {
        const r=n.getBoundingClientRect();
        return r.width>0 && r.height>0 && r.left>=-1 && r.right<=innerWidth+1 && r.top>=-1 && r.bottom<=innerHeight+1;
    }'''), selector + ' outside viewport'

def overlay_reachable(page, selector):
    overlay=page.locator(selector)
    overlay.evaluate('n=>n.scrollTop=0')
    assert overlay.evaluate('n=>n.firstElementChild.getBoundingClientRect().top>=0'), 'unreachable top'
    assert overlay.evaluate('n=>n.scrollWidth<=n.clientWidth+1'), 'horizontal overflow'
    overlay.evaluate('n=>n.scrollTop=n.scrollHeight')
    assert overlay.evaluate('n=>n.firstElementChild.getBoundingClientRect().bottom<=innerHeight+1'), 'unreachable bottom'

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'), headless=True, args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440, 'height':600})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(URL,wait_until='domcontentloaded')
    check('start screen scroll reaches both ends on short laptop',lambda:overlay_reachable(page,'#startOverlay'))
    page.locator('.scenario[data-s="heat"]').click()
    page.locator('#startBtn').click()
    page.wait_for_selector('#introContinue')
    check('initial briefing scroll reaches title and continue',lambda:overlay_reachable(page,'#scenarioIntro'))
    page.locator('#introContinue').click()
    page.locator('#centerContent button.primary').first.click()
    page.evaluate('game.saveGame()')
    base=page.evaluate("JSON.parse(localStorage.getItem('PREDEL_SAVE_V5'))")

    for width,height in [(1440,900),(1024,600),(390,844),(320,568),(844,390)]:
        page.set_viewport_size({'width':width,'height':height})
        for tab in ['build','map','city','printer','population','technology','operations','production','forecast','surface','events']:
            def panel(tab=tab):
                if tab=='surface':page.locator('.ccExpand').click()
                elif tab=='events':page.locator('.ccDispatch').click()
                else:page.evaluate('(tab)=>game.showTab(tab)',tab)
                in_view(page,'.ccDrawer')
                in_view(page,'.ccDrawerClose')
                body=page.locator('.ccDrawerBody')
                assert body.evaluate('n=>n.scrollWidth<=n.clientWidth+1'), 'body requires horizontal scrolling'
                # Open optional explanations before checking the final edge.
                body.locator('details').evaluate_all('nodes=>nodes.forEach(n=>n.open=true)')
                body.evaluate('n=>n.scrollTop=n.scrollHeight')
                in_view(page,'.ccDrawerClose')
                assert body.evaluate('''n=>{
                    const visible=[...n.querySelectorAll('p,button,table,summary')].filter(e=>e.getClientRects().length);
                    const end=Math.max(...visible.map(e=>e.getBoundingClientRect().bottom));
                    return end<=n.getBoundingClientRect().bottom+1;
                }'''), 'final text/control cannot be reached'
                assert page.locator('.ccDrawer').evaluate('n=>n.scrollHeight<=n.clientHeight+1'), 'nested outer scrollbar'
                page.keyboard.press('Escape')
            check(f'{width}x{height}: {tab} complete and scrollable',panel)

        # Real audio settings are a separate overlay, rather than the game drawer.
        page.locator('[data-action="audio"]').click()
        check(f'{width}x{height}: audio settings reachable',lambda:overlay_reachable(page,'#predelAudioSettings'))
        page.locator('#closeAudioSettings').click()

        # Replay must escape the native drawer's top layer and return to it.
        page.evaluate("game.showTab('forecast')")
        page.locator('.ccBriefing').click()
        page.wait_for_timeout(200)  # The briefing focuses its continue action after mounting.
        check(f'{width}x{height}: briefing opens above menus',lambda:in_view(page,'#introContinue'))
        check(f'{width}x{height}: replay text reachable',lambda:overlay_reachable(page,'#scenarioIntro'))
        page.locator('#introContinue').click()
        if page.locator('.ccDrawer').evaluate('d=>d.open'):page.keyboard.press('Escape')

    for scenario in ['ice','heat','nuclear','epidemic']:
        page.set_viewport_size({'width':320,'height':568})
        page.evaluate('(scenario)=>game.showScenarioIntro(scenario,true)',scenario)
        check(scenario+': narrow briefing full text',lambda:overlay_reachable(page,'#scenarioIntro'))
        page.locator('#introContinue').click()
        if page.locator('.ccDrawer').evaluate('d=>d.open'):page.keyboard.press('Escape')

    fixture=deepcopy(base)
    fixture.update(month=84,phase='Новая среда',ended=True,finalWin=True,endReason='Проверка длинного итогового отчёта',voiceEnabled=False)
    page.evaluate("s=>{localStorage.setItem('PREDEL_SAVE_V5',JSON.stringify(s));game.loadGame();}",fixture)
    check('narrow final report scroll reaches actions',lambda:overlay_reachable(page,'#endOverlay'))
    check('no uncaught browser errors',lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else None)
    browser.close()

(RESULTS/'window-layout-results.json').write_text(json.dumps({'checks':checks,'pageErrors':errors},ensure_ascii=False,indent=2))
print('TOTAL',sum(c['ok'] for c in checks),'/',len(checks),flush=True)
assert all(c['ok'] for c in checks), 'window layout checks failed'
