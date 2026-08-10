"""实验:给新工程注入 tailwind preflight 全局规则,验证布局是否与旧工程一致。"""
import json
import os

from playwright.sync_api import sync_playwright

OUT_DIR = "C:/Users/24682/AppData/Local/Temp/lowcode-shots"

PREFLIGHT = """
*, :after, :before {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: currentColor;
}
html { line-height: 1.5; }
body { font-family: inherit; line-height: inherit; }
"""

MEASURE_JS = """
() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height),
             sw: el.scrollWidth, sh: el.scrollHeight };
  };
  const header = document.querySelector('.page-item');
  const headContainer = document.querySelector('.lc-container');
  const nav = document.querySelector('.nav-menu');
  const firstRow = document.querySelectorAll('.page-item')[4]; // 轮播
  const stats = document.querySelectorAll('.page-item')[5];
  const intro = document.querySelectorAll('.page-item')[7];
  return {
    bodyScrollW: document.body.scrollWidth,
    pageWrap: pick('.page-wrap'),
    header: pick('.page-item'),
    headContainer: pick('.lc-container'),
    navMenu: pick('.nav-menu'),
    carousel: pick('.page-item:nth-of-type(2), .page-item')[4] ? pick2 : null,
    statsRow: stats ? { x: Math.round(stats.getBoundingClientRect().x), w: Math.round(stats.getBoundingClientRect().width), h: Math.round(stats.getBoundingClientRect().height) } : null,
    intro: intro ? { x: Math.round(intro.getBoundingClientRect().x), w: Math.round(intro.getBoundingClientRect().width), h: Math.round(intro.getBoundingClientRect().height) } : null,
    bodyLineHeight: getComputedStyle(document.body).lineHeight,
    bodyBoxSizing: getComputedStyle(document.body).boxSizing,
    htmlLineHeight: getComputedStyle(document.documentElement).lineHeight,
  };
}
"""


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1912, "height": 906})
        page.goto("http://localhost:8088/", wait_until="domcontentloaded", timeout=45000)
        page.wait_for_selector(".page-item", timeout=30000)
        page.wait_for_timeout(8000)
        before = page.evaluate(MEASURE_JS)
        page.add_style_tag(content=PREFLIGHT)
        page.wait_for_timeout(1000)
        after = page.evaluate(MEASURE_JS)
        page.screenshot(path=os.path.join(OUT_DIR, "new-with-preflight.png"), full_page=True)
        browser.close()

    print("=== 注入前 (NEW) ===")
    print(json.dumps(before, ensure_ascii=False, indent=1))
    print("=== 注入 tailwind preflight 后 ===")
    print(json.dumps(after, ensure_ascii=False, indent=1))
    print("\n预期(旧工程): bodyScrollW=1897, header h=80, nav h=60, page-wrap h=6481")
    print("           stats x=40 w=1817, body line-height=24px, box-sizing=border-box")


if __name__ == "__main__":
    main()
