"""Dual-view visual regression via public commands and validated save fixtures.

Run after starting Vite: PREDEL_TEST_URL=http://127.0.0.1:8020/ python tests/atmosphere_browser.py
Requires Python Playwright and Chromium; writes only to ignored test-results/.
"""
from copy import deepcopy
from hashlib import sha256
import json
import os
from pathlib import Path
import shutil
import sys

from playwright.sync_api import sync_playwright

URL = os.environ.get('PREDEL_TEST_URL', 'http://127.0.0.1:5173/')
RESULTS = Path(__file__).resolve().parent.parent / 'test-results'
RESULTS.mkdir(exist_ok=True)
checks = []
errors = []


def run(name, fn):
    try:
        fn()
        checks.append({'name': name, 'ok': True})
        print('PASS', name, flush=True)
    except Exception as error:
        checks.append({'name': name, 'ok': False, 'error': str(error)})
        print('FAIL', name, str(error), flush=True)


def saved(page):
    return page.evaluate("JSON.parse(localStorage.getItem('PREDEL_SAVE_V5'))")


def load(page, fixture):
    assert page.evaluate("s=>{localStorage.setItem('PREDEL_SAVE_V5',JSON.stringify(s));return game.loadGame();}", fixture) is not False


def fixture(base, scenario='ice', month=0):
    state = deepcopy(base)
    state.update(scenario=scenario, month=month, environment=None, event=None,
                 pendingEvent=None, voiceEnabled=False, ended=False, finalWin=None,
                 actions=20, hazard={0: 0, 22: 64, 45: 76, 75: 83}[month],
                 phase={0: 'Подготовка', 22: 'Обрушение', 45: 'Глубокий кризис', 75: 'Новая среда'}[month])
    state['community'] = {'nextOfferMonth': month + 20, 'offer': None}
    return state


def frame(page, selector='#sceneCanvas'):
    return sha256(page.locator(selector).evaluate('(c)=>c.toDataURL()').encode()).hexdigest()


def dual_visible(page):
    assert page.locator('.ccExteriorFeed #sceneCanvas').count() == 1
    size = page.viewport_size
    scroller = page.locator('.ccHabitat')
    scroll_top = scroller.evaluate('(e)=>e.scrollTop')
    for selector in ['#sceneCanvas', '#isometricWorld']:
        assert page.locator(selector).is_visible(), selector
        rect = page.locator(selector).bounding_box()
        assert rect and rect['height'] >= 80 and rect['width'] >= 180, (selector, rect)
        if size['height'] >= 700:
            assert rect['y'] >= -1 and rect['y'] + rect['height'] <= size['height'] + 1, (selector, rect, size)
        else:
            # Short landscape layouts keep readable scenes in a scrollable middle
            # area while navigation and next-month controls remain fixed.
            page.locator(selector).scroll_into_view_if_needed()
            overlap = page.locator(selector).evaluate('''c=>{
                const r=c.getBoundingClientRect(),p=c.closest('.ccHabitat').getBoundingClientRect();
                return Math.min(r.bottom,p.bottom)-Math.max(r.top,p.top);
            }''')
            assert overlap >= 80, (selector, overlap)
    scroller.evaluate('(e,y)=>e.scrollTop=y', scroll_top)
    assert page.locator('.ccAdvance').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'page horizontal overflow'


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),
        headless=True, args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL, wait_until='domcontentloaded')
    page.locator('.scenario[data-s="ice"]').click()
    page.locator('#startBtn').click()
    page.locator('#introContinue').click()
    page.locator('#centerContent button.primary').first.click()
    page.evaluate('game.saveGame()')
    page.wait_for_selector('.ccExteriorFeed #sceneCanvas', timeout=15000)
    page.wait_for_timeout(1200)
    base = saved(page)
    assert base and base['site']

    for scenario in ['ice', 'heat', 'nuclear', 'epidemic']:
        for month, phase in [(0, '0'), (22, '1'), (45, '2'), (75, '3')]:
            def phase_check(scenario=scenario, month=month, phase=phase):
                load(page, fixture(base, scenario, month))
                page.wait_for_timeout(150)
                dual_visible(page)
                canvas = page.locator('#sceneCanvas')
                assert canvas.get_attribute('data-phase') == phase
                assert page.locator('body').get_attribute('data-scenario') == scenario
                title = page.locator('#sceneContent .sceneTitle').text_content()
                if month:
                    assert 'Последние спокойные' not in title, title
                assert len(canvas.evaluate('(c)=>c.toDataURL()')) > 10000
            run(f'{scenario}: visible exterior and interior at month {month}', phase_check)

    for name, terrain in [('Скалистый склон', 'rock'), ('Старый карьер', 'quarry'),
                          ('Лесистый холм', 'forest'), ('Промышленная зона', 'industrial'),
                          ('Открытое плато', 'plateau'), ('Речная долина', 'river')]:
        def location_check(name=name, terrain=terrain):
            state = fixture(base)
            state['site']['name'] = name
            load(page, state)
            assert page.locator('#sceneCanvas').get_attribute('data-location') == terrain
            assert name in page.locator('#sceneContent').text_content()
            dual_visible(page)
        run('location remains reflected in exterior: ' + terrain, location_check)

    for width, height in [(1440, 1000), (1280, 720), (390, 844), (844, 390)]:
        def viewport_check(width=width, height=height):
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(250)
            dual_visible(page)
            sizing = page.locator('#sceneCanvas').evaluate('''c=>{
                const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
                return {width:c.width,height:c.height,expectedWidth:Math.round(r.width)*d,expectedHeight:Math.round(r.height)*d};
            }''')
            assert abs(sizing['width'] - sizing['expectedWidth']) <= 2, sizing
            assert abs(sizing['height'] - sizing['expectedHeight']) <= 2, sizing
            page.screenshot(path=str(RESULTS / f'atmosphere-{width}x{height}.png'))
        run(f'both worlds and correctly sized canvas at {width}x{height}', viewport_check)

    page.set_viewport_size({'width': 1440, 'height': 1000})
    load(page, fixture(base, 'nuclear', 45))
    page.wait_for_timeout(250)

    def expanded_world():
        before = saved(page)
        page.evaluate('window.__exteriorCanvas=document.getElementById("sceneCanvas")')
        page.locator('.ccExpand').click()
        assert page.locator('.ccDrawer').evaluate('(d)=>d.open')
        assert page.locator('.ccSurface #sceneCanvas').is_visible()
        page.locator('.ccDrawerClose').click()
        dual_visible(page)
        assert page.evaluate('window.__exteriorCanvas===document.getElementById("sceneCanvas")')
        page.locator('.ccExpand').click()
        page.keyboard.press('Escape')
        page.wait_for_timeout(80)
        dual_visible(page)
        assert not page.locator('.ccDrawer').evaluate('(d)=>d.open')
        assert saved(page) == before, 'panorama expansion mutated the saved simulation'
    run('same live panorama returns after close and Escape without state mutation', expanded_world)

    def navigation_returns_world():
        page.locator('.ccExpand').click()
        page.evaluate("game.showTab('city')")
        assert page.locator('#ccDrawerTitle').text_content() == 'Экспедиции'
        assert page.locator('.ccExteriorFeed #sceneCanvas').count() == 1
        page.locator('.ccDrawerClose').click()
        dual_visible(page)
    run('switching expanded panorama to operational panel restores exterior', navigation_returns_world)

    def live_frames():
        load(page, fixture(base, 'ice', 45))
        page.wait_for_timeout(1100)
        exterior = frame(page)
        interior = frame(page, '#isometricWorld')
        page.wait_for_timeout(220)
        assert frame(page) != exterior, 'exterior stopped animating'
        assert frame(page, '#isometricWorld') != interior, 'interior stopped animating'
    run('exterior weather and internal activity both animate', live_frames)

    def camera_readonly():
        before = saved(page)
        page.locator('.ccCamera select').select_option('base:water')
        page.locator('[data-action="zoomIn"]').click()
        page.locator('[data-action="fit"]').click()
        assert saved(page) == before
        page.locator('.ccInspectorClose').click()
    run('camera and inspection leave authoritative state intact', camera_readonly)

    reduced = browser.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce')
    reduced.on('pageerror', lambda error: errors.append(str(error)))
    reduced.goto(URL, wait_until='domcontentloaded')
    load(reduced, fixture(base, 'ice', 45))
    reduced.wait_for_timeout(1700)

    for scenario in ['ice', 'heat', 'nuclear', 'epidemic']:
        def distinct_phases(scenario=scenario):
            fingerprints = []
            for month in [0, 22, 45, 75]:
                load(reduced, fixture(base, scenario, month))
                # Existing reduced-motion renderer refreshes at 800 ms; all frames
                # use the same fixed clock, so differences come from game stage.
                reduced.wait_for_timeout(850)
                fingerprints.append(frame(reduced))
            assert len(set(fingerprints)) == 4, (scenario, fingerprints)
        run(scenario + ': four stage images differ with animation clock fixed', distinct_phases)

    def construction_visible():
        state = fixture(base, 'ice', 45)
        load(reduced, state)
        reduced.wait_for_timeout(100)
        before = frame(reduced, '#isometricWorld')
        state['built'].update(habitat=2, farm=1, water=1)
        load(reduced, state)
        reduced.wait_for_timeout(100)
        assert frame(reduced, '#isometricWorld') != before
        assert reduced.locator('.ccCamera select option[value="habitat:2"]').count() == 1
    run('built modules visibly expand the internal settlement', construction_visible)

    load(reduced, fixture(base, 'ice', 45))
    reduced.wait_for_timeout(900)

    def reduced_frames():
        dual_visible(reduced)
        exterior = frame(reduced)
        interior = frame(reduced, '#isometricWorld')
        reduced.wait_for_timeout(950)
        assert frame(reduced) == exterior, 'reduced-motion exterior is still moving'
        assert frame(reduced, '#isometricWorld') == interior, 'reduced-motion interior is still moving'
    run('reduced motion keeps both worlds visible and still', reduced_frames)

    run('no uncaught browser errors', lambda: (_ for _ in ()).throw(AssertionError(errors)) if errors else None)
    browser.close()

report = {'checks': checks, 'pageErrors': errors}
(RESULTS / 'atmosphere-browser-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(f'TOTAL {sum(check["ok"] for check in checks)} / {len(checks)}', flush=True)
sys.exit(1 if any(not check['ok'] for check in checks) else 0)
