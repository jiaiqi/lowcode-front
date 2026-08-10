"""实验2:注入完整 tailwind preflight,对比新页面与旧页面关键布局是否完全一致。"""
import json
import os

from playwright.sync_api import sync_playwright

OUT_DIR = "C:/Users/24682/AppData/Local/Temp/lowcode-shots"

MEASURE_JS = """
() => {
  const items = [...document.querySelectorAll('.page-item')];
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const nav = document.querySelector('.nav-menu');
  const navItems = nav ? [...nav.querySelectorAll('a, li, span')].slice(0, 6).map((i) => ({ tag: i.tagName, cls: (i.className || '').slice(0, 40), fs: getComputedStyle(i).fontSize, lh: getComputedStyle(i).lineHeight, pad: getComputedStyle(i).padding, r: rect(i) })) : [];
  return {
    bodyScrollW: document.body.scrollWidth,
    htmlFontSize: getComputedStyle(document.documentElement).fontSize,
    htmlLineHeight: getComputedStyle(document.documentElement).lineHeight,
    bodyLineHeight: getComputedStyle(document.body).lineHeight,
    bodyBoxSizing: getComputedStyle(document.body).boxSizing,
    pageWrap: rect(document.querySelector('.page-wrap')),
    header: rect(items[0]),
    navMenu: rect(nav),
    navItems,
    carousel: rect(items[4]),
    statsTitle: rect(items[5]),
    statsRow: rect(items[6]),
    intro: rect(items[7]),
    footer: rect(items[items.length - 1]),
  };
}
"""


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        out = {}
        for tag, url, css in (
            ("old", "http://192.168.0.214/#/", None),
            ("new-preflight", "http://localhost:8088/", open(os.path.join(OUT_DIR, "preflight-full.css"), encoding="utf-8").read()),
        ):
            page = browser.new_page(viewport={"width": 1912, "height": 906})
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_selector(".page-item", timeout=30000)
            page.wait_for_timeout(8000)
            if css:
                page.add_style_tag(content=css)
                page.wait_for_timeout(1000)
            out[tag] = page.evaluate(MEASURE_JS)
            page.close()
        browser.close()

    with open(os.path.join(OUT_DIR, "preflight-compare.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    old, new = out["old"], out["new-preflight"]
    for key in old:
        a, b = old[key], new[key]
        same = json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)
        mark = "OK " if same else "DIFF"
        print(f"[{mark}] {key}")
        if not same:
            print(f"   OLD: {json.dumps(a, ensure_ascii=False)[:400]}")
            print(f"   NEW: {json.dumps(b, ensure_ascii=False)[:400]}")


if __name__ == "__main__":
    main()
